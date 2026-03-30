import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../../database/entities/project.entity';
import { User } from '../../database/entities/user.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async create(createDto: CreateProjectDto, owner: User): Promise<Project> {
    const project = this.projectRepo.create({
      ...createDto,
      owner,
    });

    if (createDto.memberIds?.length) {
      const members = await this.userRepo.findByIds(createDto.memberIds);
      project.members = members;
    }

    return this.projectRepo.save(project);
  }

  async findAll(user: User): Promise<Project[]> {
    // المستخدم يرى المشاريع التي هو مالكها أو عضو فيها
    return this.projectRepo
      .createQueryBuilder('project')
      .leftJoin('project.members', 'member')
      .leftJoin('project.owner', 'owner')
      .where('owner.id = :userId', { userId: user.id })
      .orWhere('member.id = :userId', { userId: user.id })
      .getMany();
  }

  async findOne(id: string, user: User): Promise<Project> {
    const project = await this.projectRepo.findOne({
      where: { id },
      relations: ['owner', 'members', 'tasks'],
    });
    if (!project) throw new NotFoundException('Project not found');
    
    // التحقق من الصلاحية
    if (project.owner.id !== user.id && !project.members.some(m => m.id === user.id)) {
      throw new ForbiddenException('You do not have access to this project');
    }
    return project;
  }

  async update(id: string, updateDto: UpdateProjectDto, user: User): Promise<Project> {
    const project = await this.findOne(id, user);
    // فقط المالك يمكنه التعديل
    if (project.owner.id !== user.id) {
      throw new ForbiddenException('Only project owner can update');
    }

    Object.assign(project, updateDto);
    if (updateDto.memberIds) {
      const members = await this.userRepo.findByIds(updateDto.memberIds);
      project.members = members;
    }
    return this.projectRepo.save(project);
  }

  async remove(id: string, user: User): Promise<void> {
    const project = await this.findOne(id, user);
    if (project.owner.id !== user.id) {
      throw new ForbiddenException('Only project owner can delete');
    }
    await this.projectRepo.remove(project);
  }
}