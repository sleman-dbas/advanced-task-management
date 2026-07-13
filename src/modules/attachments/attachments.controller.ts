import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { AttachmentsService } from './attachments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { Request } from 'express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

// Example DTOs – replace with your actual DTOs if needed
class AttachmentResponseDto {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  taskId?: string;
  projectId?: string;
  createdAt: Date;
}

class MessageResponseDto {
  message: string;
}

@ApiTags('attachments')
@ApiBearerAuth()
@Controller('attachments')
@UseGuards(JwtAuthGuard)
export class AttachmentsController {
  constructor(private attachmentsService: AttachmentsService) {}

  // رفع ملف لمهمة
  @Post('tasks/:taskId')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload an attachment to a task' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiParam({ name: 'taskId', description: 'Task ID' })
  @ApiResponse({ status: 201, description: 'Attachment uploaded successfully', type: AttachmentResponseDto })
  @ApiResponse({ status: 400, description: 'No file provided' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden – insufficient permissions' })
  async uploadToTask(
    @Param('taskId') taskId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    if (!file) throw new BadRequestException('لم يتم إرسال أي ملف');
    return this.attachmentsService.uploadToTask(taskId, file, req.user as any);
  }

  // رفع ملف لمشروع
  @Post('projects/:projectId')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload an attachment to a project' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({ status: 201, description: 'Attachment uploaded successfully', type: AttachmentResponseDto })
  @ApiResponse({ status: 400, description: 'No file provided' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden – insufficient permissions' })
  async uploadToProject(
    @Param('projectId') projectId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    if (!file) throw new BadRequestException('لم يتم إرسال أي ملف');
    return this.attachmentsService.uploadToProject(projectId, file, req.user as any);
  }

  // قائمة مرفقات مهمة
  @Get('tasks/:taskId')
  @ApiOperation({ summary: 'Get all attachments for a task' })
  @ApiParam({ name: 'taskId', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'List of task attachments', type: [AttachmentResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden – insufficient permissions' })
  async getTaskAttachments(@Param('taskId') taskId: string, @Req() req: Request) {
    return this.attachmentsService.getTaskAttachments(taskId, req.user as any);
  }

  // قائمة مرفقات مشروع
  @Get('projects/:projectId')
  @ApiOperation({ summary: 'Get all attachments for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'List of project attachments', type: [AttachmentResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden – insufficient permissions' })
  async getProjectAttachments(@Param('projectId') projectId: string, @Req() req: Request) {
    return this.attachmentsService.getProjectAttachments(projectId, req.user as any);
  }

  // تحميل ملف معين
  @Get('download/:id')
  @ApiOperation({ summary: 'Download an attachment by ID' })
  @ApiParam({ name: 'id', description: 'Attachment ID' })
  @ApiResponse({ status: 200, description: 'File download' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden – insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Attachment not found' })
  async downloadAttachment(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const { path, attachment } = await this.attachmentsService.getAttachmentPath(id, req.user as any);
    // إرسال الملف مع اسمه الأصلي
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(attachment.originalName)}"`);
    res.sendFile(require('path').resolve(path));
  }

  // حذف مرفق
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an attachment by ID' })
  @ApiParam({ name: 'id', description: 'Attachment ID' })
  @ApiResponse({ status: 200, description: 'Attachment deleted', type: MessageResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden – insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Attachment not found' })
  async deleteAttachment(@Param('id') id: string, @Req() req: Request) {
    await this.attachmentsService.deleteAttachment(id, req.user as any);
    return { message: 'تم حذف المرفق بنجاح' };
  }
}