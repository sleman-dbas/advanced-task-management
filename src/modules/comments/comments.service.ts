import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { User } from 'src/database/entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from 'src/database/entities/task.entity';
import { Comment } from 'src/database/entities/comment.entity';

@Injectable()
export class CommentsService {
    constructor(
        @InjectRepository(Task)
        private taskRepo: Repository<Task>,
        @InjectRepository(Comment)
        private commentRepo: Repository<Comment>,
    ) {}

    async create(createDto: CreateCommentDto, author: User): Promise<Comment> {
  const task = await this.taskRepo.findOne({ where: { id: createDto.taskId }, relations: ['project'] });
  if (!task) throw new NotFoundException('Task not found');
  // التحقق من صلاحية الوصول إلى المشروع ...
  const comment = this.commentRepo.create({ ...createDto, author, task });
  return this.commentRepo.save(comment);
}
}
