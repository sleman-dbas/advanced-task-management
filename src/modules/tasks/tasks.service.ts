import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus } from '../../database/entities/task.entity';
import { Project } from '../../database/entities/project.entity';
import { User } from '../../database/entities/user.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepo: Repository<Task>,
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async create(createDto: CreateTaskDto, creator: User): Promise<Task> {
    const project = await this.projectRepo.findOne({
      where: { id: createDto.projectId },
      relations: ['members', 'owner'],
    });
    if (!project) throw new NotFoundException('Project not found');

    // التحقق من أن المنشئ مالك أو عضو في المشروع
    const isMember = project.owner.id === creator.id || project.members.some(m => m.id === creator.id);
    if (!isMember) throw new ForbiddenException('You are not a member of this project');

    let assignee: User | null = null;
    if (createDto.assigneeId) {
        const found = await this.userRepo.findOne({ where: { id: createDto.assigneeId } });
        if (!found) throw new NotFoundException('Assignee not found');
        assignee = found;
      // التحقق من أن المُعيَّن أيضاً عضو في المشروع
      const isAssigneeMember = project.owner.id === found.id || project.members.some(m => m.id === found.id);
      if (!isAssigneeMember) throw new ForbiddenException('Assignee is not a member of this project');
    }

    const task = this.taskRepo.create({
      ...createDto,
      creator,
      assignee: assignee || undefined,
      project,
    });
    return this.taskRepo.save(task);
  }

  async findAll(user: User, projectId?: string): Promise<Task[]> {
    const query = this.taskRepo
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.project', 'project')
      .leftJoin('project.members', 'member')
      .leftJoin('project.owner', 'owner')
      .where('owner.id = :userId', { userId: user.id })
      .orWhere('member.id = :userId', { userId: user.id });

    if (projectId) {
      query.andWhere('task.projectId = :projectId', { projectId });
    }
    return query.getMany();
  }

  async findOne(id: string, user: User): Promise<Task> {
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: ['project', 'creator', 'assignee', 'comments', 'comments.author', 'watchers'],
    });
    if (!task) throw new NotFoundException('Task not found');

    const project = task.project;
    const isAuthorized = project.owner.id === user.id || project.members?.some(m => m.id === user.id);
    if (!isAuthorized) throw new ForbiddenException('Access denied');

    return task;
  }

  async update(id: string, updateDto: UpdateTaskDto, user: User): Promise<Task> {
    const task = await this.findOne(id, user);
    // يمكن لأي عضو تعديل المهمة (يمكن تحسين الصلاحية لاحقاً)
    Object.assign(task, updateDto);
    if (updateDto.status === TaskStatus.DONE && !task.completedAt) {
      task.completedAt = new Date();
    }
    return this.taskRepo.save(task);
  }

  async remove(id: string, user: User): Promise<void> {
    const task = await this.findOne(id, user);
    // فقط منشئ المهمة أو مالك المشروع يمكنه الحذف
    if (task.creator.id !== user.id && task.project.owner.id !== user.id) {
      throw new ForbiddenException('You cannot delete this task');
    }
    await this.taskRepo.remove(task);
  }
}