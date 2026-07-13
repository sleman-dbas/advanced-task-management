import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Task } from './task.entity';
import { Project } from './project.entity';
import { User } from './user.entity';

@Entity('attachments')
export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  filename: string; // الاسم الأصلي للملف

  @Column()
  originalName: string; // الاسم عند التخزين

  @Column()
  mimeType: string;

  @Column()
  size: number; // بالبايت

  @Column({ nullable: true })
  path: string; // المسار النسبي للتخزين المحلي

  @Column({ nullable: true })
  url: string; // رابط عام للتخزين السحابي

  @ManyToOne(() => Task, (task) => task.attachments, { onDelete: 'CASCADE', nullable: true })
  task: Task;

  @ManyToOne(() => Project, (project) => project.attachments, { onDelete: 'CASCADE', nullable: true })
  project: Project;

  @ManyToOne(() => User, { nullable: false })
  uploadedBy: User;

  @CreateDateColumn()
  uploadedAt: Date;
}