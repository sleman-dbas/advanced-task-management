import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { User } from './user.entity';
import { Project } from './project.entity';
import { Comment } from './comment.entity';

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  DONE = 'done',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => User, { nullable: true })
  assignee: User;

  @ManyToOne(() => User, { nullable: false })
  creator: User;

  @ManyToOne(() => Project, project => project.tasks, { onDelete: 'CASCADE' })
  project: Project;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  status: TaskStatus;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @Column({ type: 'date', nullable: true })
  dueDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @OneToMany(() => Comment, comment => comment.task, { cascade: true })
  comments: Comment[];

  @ManyToMany(() => User)
  @JoinTable({ name: 'task_watchers' })
  watchers: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}