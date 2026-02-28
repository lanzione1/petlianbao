import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Merchant } from '../merchant/merchant.entity';

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
}

@Entity('media')
export class Media {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'merchant_id' })
  merchantId: string;

  @ManyToOne(() => Merchant)
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @Column({ name: 'type', length: 20, default: MediaType.IMAGE })
  type: MediaType;

  @Column({ name: 'name', length: 200 })
  name: string;

  @Column({ name: 'url', length: 500 })
  url: string;

  @Column({ name: 'size', type: 'int', default: 0 })
  size: number;

  @Column({ name: 'mime_type', length: 100, nullable: true })
  mimeType: string;

  @Column({ name: 'category', length: 50, nullable: true })
  category: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
