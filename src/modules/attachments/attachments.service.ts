import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attachment } from '../../database/entities/attachment.entity';
import { Task } from '../../database/entities/task.entity';
import { Project } from '../../database/entities/project.entity';
import { User } from '../../database/entities/user.entity';
import { createReadStream, unlinkSync } from 'fs';
import { join } from 'path';

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(Attachment)
    private attachmentRepo: Repository<Attachment>,
    @InjectRepository(Task)
    private taskRepo: Repository<Task>,
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,
  ) {}

  /**
   * رفع ملف لمهمة
   */
  async uploadToTask(
    taskId: string,
    file: Express.Multer.File,
    user: User,
  ): Promise<Attachment> {
    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: ['project', 'project.members', 'project.owner'],
    });
    if (!task) throw new NotFoundException('المهمة غير موجودة');

    // التحقق من صلاحية المستخدم للمشروع
    const project = task.project;
    const isAuthorized =
      project.owner.id === user.id ||
      project.members.some((m) => m.id === user.id);
    if (!isAuthorized) throw new ForbiddenException('لا تملك صلاحية رفع ملف لهذه المهمة');

    const attachment = this.attachmentRepo.create({
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: file.path,
      task,
      uploadedBy: user,
    });
    return this.attachmentRepo.save(attachment);
  }

  /**
   * رفع ملف لمشروع
   */
  async uploadToProject(
    projectId: string,
    file: Express.Multer.File,
    user: User,
  ): Promise<Attachment> {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
      relations: ['members', 'owner'],
    });
    if (!project) throw new NotFoundException('المشروع غير موجود');

    const isAuthorized =
      project.owner.id === user.id ||
      project.members.some((m) => m.id === user.id);
    if (!isAuthorized) throw new ForbiddenException('لا تملك صلاحية رفع ملف لهذا المشروع');

    const attachment = this.attachmentRepo.create({
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: file.path,
      project,
      uploadedBy: user,
    });
    return this.attachmentRepo.save(attachment);
  }

  /**
   * الحصول على قائمة المرفقات لمهمة
   */
  async getTaskAttachments(taskId: string, user: User): Promise<Attachment[]> {
    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: ['project', 'project.members', 'project.owner'],
    });
    if (!task) throw new NotFoundException('المهمة غير موجودة');

    const project = task.project;
    const isAuthorized =
      project.owner.id === user.id ||
      project.members.some((m) => m.id === user.id);
    if (!isAuthorized) throw new ForbiddenException('لا تملك صلاحية الوصول لهذه المهمة');

    return this.attachmentRepo.find({
      where: { task: { id: taskId } },
      relations: ['uploadedBy'],
      order: { uploadedAt: 'DESC' },
    });
  }

  /**
   * الحصول على قائمة المرفقات لمشروع
   */
  async getProjectAttachments(projectId: string, user: User): Promise<Attachment[]> {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
      relations: ['members', 'owner'],
    });
    if (!project) throw new NotFoundException('المشروع غير موجود');

    const isAuthorized =
      project.owner.id === user.id ||
      project.members.some((m) => m.id === user.id);
    if (!isAuthorized) throw new ForbiddenException('لا تملك صلاحية الوصول لهذا المشروع');

    return this.attachmentRepo.find({
      where: { project: { id: projectId } },
      relations: ['uploadedBy'],
      order: { uploadedAt: 'DESC' },
    });
  }

  /**
   * حذف مرفق
   */
  async deleteAttachment(attachmentId: string, user: User): Promise<void> {
    const attachment = await this.attachmentRepo.findOne({
      where: { id: attachmentId },
      relations: ['task', 'task.project', 'project', 'uploadedBy'],
    });
    if (!attachment) throw new NotFoundException('المرفق غير موجود');

    // التحقق من الصلاحية: فقط رافع الملف أو مالك المشروع يمكنه الحذف
    let isAuthorized = attachment.uploadedBy.id === user.id;
    if (!isAuthorized && attachment.task) {
      isAuthorized = attachment.task.project.owner.id === user.id;
    } else if (!isAuthorized && attachment.project) {
      isAuthorized = attachment.project.owner.id === user.id;
    }
    if (!isAuthorized) throw new ForbiddenException('لا تملك صلاحية حذف هذا المرفق');

    // حذف الملف الفعلي من النظام
    if (attachment.path) {
      try {
        unlinkSync(attachment.path);
      } catch (err) {
        console.error('Failed to delete physical file:', err);
      }
    }

    await this.attachmentRepo.remove(attachment);
  }

  /**
   * استرجاع مسار الملف لتنزيله (تستخدم في الـ Controller)
   */
  async getAttachmentPath(attachmentId: string, user: User): Promise<{ path: string; attachment: Attachment }> {
    const attachment = await this.attachmentRepo.findOne({
      where: { id: attachmentId },
      relations: ['task', 'task.project', 'project'],
    });
    if (!attachment) throw new NotFoundException('المرفق غير موجود');

    // التحقق من صلاحية الوصول
    let isAuthorized = false;
    if (attachment.task) {
      const project = attachment.task.project;
      isAuthorized =
        project.owner.id === user.id ||
        project.members.some((m) => m.id === user.id);
    } else if (attachment.project) {
      isAuthorized =
        attachment.project.owner.id === user.id ||
        attachment.project.members.some((m) => m.id === user.id);
    }
    if (!isAuthorized) throw new ForbiddenException('لا تملك صلاحية الوصول لهذا المرفق');

    if (!attachment.path || !attachment.path.startsWith('uploads/')) {
      throw new BadRequestException('مسار الملف غير صالح');
    }
    return { path: attachment.path, attachment };
  }
}