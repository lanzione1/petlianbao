import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type CampaignType = 'poster' | 'coupon' | 'birthday' | 'broadcast';

@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'merchant_id' })
  merchantId: string;

  @Column({ length: 20 })
  type: CampaignType;

  @Column({ length: 100, nullable: true })
  title: string;

  @Column({ type: 'json', nullable: true })
  content: Record<string, any>;

  @Column({ name: 'target_tags', type: 'json', nullable: true })
  targetTags: string[];

  @Column({ name: 'sent_count', default: 0 })
  sentCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
