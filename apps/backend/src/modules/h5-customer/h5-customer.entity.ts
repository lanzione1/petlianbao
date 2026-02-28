import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Merchant } from '../merchant/merchant.entity';

@Entity('h5_customers')
export class H5Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'merchant_id' })
  merchantId: string;

  @ManyToOne(() => Merchant)
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @Column({ name: 'openid', length: 64, nullable: true })
  openid: string;

  @Column({ name: 'unionid', length: 64, nullable: true })
  unionid: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 50, nullable: true })
  nickname: string;

  @Column({ length: 255, nullable: true })
  avatar: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
