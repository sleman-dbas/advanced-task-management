import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../../database/entities/task.entity';
import { Project } from '../../database/entities/project.entity';
import { User } from '../../database/entities/user.entity';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Task, Project, User])],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}