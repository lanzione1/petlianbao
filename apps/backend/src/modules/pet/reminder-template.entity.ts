import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('reminder_templates')
export class ReminderTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'merchant_id' })
  merchantId: string;

  @Column({ name: 'birthday_template', type: 'text', default: '尊敬的客户，祝您家{petName}生日快乐！🎂' })
  birthdayTemplate: string;

  @Column({ name: 'vaccine_template', type: 'text', default: '您好，您家{petName}的疫苗即将到期，请及时接种💉' })
  vaccineTemplate: string;

  @Column({ name: 'deworm_template', type: 'text', default: '您好，您家{petName}的驱虫即将到期，请及时驱虫🐛' })
  dewormTemplate: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
