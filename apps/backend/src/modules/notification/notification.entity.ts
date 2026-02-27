import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type NotificationType = 'wechat' | 'sms';
export type NotificationStatus = 'pending' | 'sent' | 'failed';
export type UserType = 'customer' | 'merchant';

@Entity('notification_logs')
export class NotificationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'user_type', length: 20 })
  userType: UserType;

  @Column({ length: 20 })
  type: NotificationType;

  @Column({ name: 'template_id', length: 100, nullable: true })
  templateId: string;

  @Column({ type: 'jsonb', nullable: true })
  content: Record<string, any>;

  @Column({ length: 20, default: 'pending' })
  status: NotificationStatus;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}