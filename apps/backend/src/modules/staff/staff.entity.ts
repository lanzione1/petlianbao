import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Merchant } from '../merchant/merchant.entity';

@Entity('staffs')
export class Staff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'merchant_id' })
  merchantId: string;

  @ManyToOne(() => Merchant)
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @Column({ name: 'openid', unique: true, length: 100 })
  openid: string;

  @Column({ name: 'nickname', length: 50, nullable: true })
  nickname: string;

  @Column({ name: 'avatar', length: 255, nullable: true })
  avatar: string;

  @Column({ name: 'role', default: 'staff', length: 20 })
  role: 'admin' | 'staff';

  @Column({ name: 'status', default: 'active', length: 20 })
  status: 'active' | 'disabled';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
