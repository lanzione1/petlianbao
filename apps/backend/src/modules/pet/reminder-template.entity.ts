import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('reminder_templates')
export class ReminderTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'merchant_id' })
  merchantId: string;

  @Column({ name: 'birthday_template', type: 'text', nullable: true })
  birthdayTemplate: string;

  @Column({ name: 'vaccine_template', type: 'text', nullable: true })
  vaccineTemplate: string;

  @Column({ name: 'deworm_template', type: 'text', nullable: true })
  dewormTemplate: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
