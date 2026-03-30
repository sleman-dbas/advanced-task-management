import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Task } from './task.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => User, { nullable: false })
  author: User;

  @ManyToOne(() => Task, task => task.comments, { onDelete: 'CASCADE' })
  task: Task;

  @CreateDateColumn()
  createdAt: Date;
}
