import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Admin } from './admin.entity';

@Entity('admin_logs')
export class AdminLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'admin_id' })
  adminId: string;

  @ManyToOne(() => Admin)
  @JoinColumn({ name: 'admin_id' })
  admin: Admin;

  @Column({ name: 'action', length: 50 })
  action: string;

  @Column({ name: 'target_type', length: 50, nullable: true })
  targetType: string;

  @Column({ name: 'target_id', length: 100, nullable: true })
  targetId: string;

  @Column({ name: 'detail', type: 'jsonb', nullable: true })
  detail: Record<string, any>;

  @Column({ name: 'ip', length: 50, nullable: true })
  ip: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
