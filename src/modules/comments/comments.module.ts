import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from 'src/database/entities/task.entity';
import { Project } from 'src/database/entities/project.entity';
import { User } from 'src/database/entities/user.entity';
import { Comment } from 'src/database/entities/comment.entity';

@Module({
  imports: [    TypeOrmModule.forFeature([Comment, Task, Project, User]),],
  providers: [CommentsService],
  controllers: [CommentsController]
})
export class CommentsModule {}
 