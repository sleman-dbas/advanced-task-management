import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus } from '../../database/entities/task.entity';
import { Project } from '../../database/entities/project.entity';
import { User } from '../../database/entities/user.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Inject, forwardRef } from '@nestjs/common';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { NotificationsService } from '../notifications/notifications.service';


@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepo: Repository<Task>,
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @Inject(forwardRef(() => NotificationsGateway))
    private notificationsGateway: NotificationsGateway,
    private notificationsService: NotificationsService,
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
    const savedTask = await this.taskRepo.save(task);

     // إرسال إشعار للمستخدم المعين إذا كان موجوداً
    if (task.assignee && task.assignee.id !== creator.id) {
      const notification = await this.notificationsService.createNotification(
        task.assignee.id,
        'task_assigned',
        {
          taskId: task.id,
          title: task.title,
          projectName: project.name,
          assignedBy: creator.email,
        },
      );
      this.notificationsGateway.sendNotificationToUser(task.assignee.id, notification);
    }
      return savedTask;
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
    // 1. Fetch the existing task with necessary relations
    const oldTask = await this.findOne(id, user);

    // 2. Apply the updates
    Object.assign(oldTask, updateDto);

    // 3. If status is DONE and completedAt not set, set it
    if (updateDto.status === TaskStatus.DONE && !oldTask.completedAt) {
      oldTask.completedAt = new Date();
    }

    // 4. Save the updated task
    const updatedTask = await this.taskRepo.save(oldTask);

    // 5. Send notification if the status has changed and the task has an assignee
    if (updateDto.status && updateDto.status !== oldTask.status && updatedTask.assignee) {
      const notification = await this.notificationsService.createNotification(
        updatedTask.assignee.id,
        'task_status_changed',
        {
          taskId: updatedTask.id,
          title: updatedTask.title,
          oldStatus: oldTask.status,
          newStatus: updatedTask.status,
          updatedBy: user.email,
        },
      );
      this.notificationsGateway.sendNotificationToUser(updatedTask.assignee.id, notification);
    }

    return updatedTask;
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