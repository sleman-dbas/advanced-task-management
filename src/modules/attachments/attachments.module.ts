import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Attachment } from '../../database/entities/attachment.entity';
import { Task } from '../../database/entities/task.entity';
import { Project } from '../../database/entities/project.entity';
import { AttachmentsService } from './attachments.service';
import { AttachmentsController } from './attachments.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attachment, Task, Project]),
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads', // المجلد المحلي للتخزين
        filename: (req, file, cb) => {
          const uniqueName = uuidv4() + extname(file.originalname);
          cb(null, uniqueName);
        },
      }),
      fileFilter: (req, file, cb) => {
        // قبول الصور والمستندات الشائعة
        const allowedMimes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('نوع الملف غير مدعوم'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
      },
    }),
  ],
  controllers: [AttachmentsController],
  providers: [AttachmentsService],
  exports: [AttachmentsService],
})
export class AttachmentsModule {}