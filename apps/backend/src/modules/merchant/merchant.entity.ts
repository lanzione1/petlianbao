import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('merchants')
export class Merchant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'openid', unique: true, length: 100 })
  openid: string;

  @Column({ name: 'shop_name', length: 100 })
  shopName: string;

  @Column({ name: 'owner_name', length: 50, nullable: true })
  ownerName: string;

  @Column({ name: 'phone', length: 20, nullable: true })
  phone: string;

  @Column({ name: 'address', length: 200, nullable: true })
  address: string;

  @Column({ name: 'detailed_address', length: 200, nullable: true })
  detailedAddress: string;

  @Column({ name: 'status', length: 20, default: 'active' })
  status: string;

  @Column({ 
    name: 'business_hours', 
    type: 'json', 
    nullable: true
  })
  businessHours: Record<string, any>;

  @Column({ name: 'plan_type', default: 'free', length: 20 })
  planType: string;

  @Column({ name: 'plan_expired_at', nullable: true, type: 'timestamp' })
  planExpiredAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
