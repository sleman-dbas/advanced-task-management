import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { User } from './user.entity';
import { Task } from './task.entity';

export enum ProjectStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
  ARCHIVED = 'archived',
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => User, { nullable: false })
  owner: User;

  @ManyToMany(() => User)
  @JoinTable({ name: 'project_members' })
  members: User[];

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.ACTIVE,
  })
  status: ProjectStatus;

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @OneToMany(() => Task, task => task.project, { cascade: true })
  tasks: Task[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}