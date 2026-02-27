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

export enum WithdrawalStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('withdrawals')
export class Withdrawal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'merchant_id' })
  merchantId: string;

  @ManyToOne(() => Merchant)
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @Column({ name: 'amount', type: 'int' })
  amount: number;

  @Column({ name: 'bank_name', length: 100, nullable: true })
  bankName: string;

  @Column({ name: 'bank_account', length: 50, nullable: true })
  bankAccount: string;

  @Column({ name: 'account_name', length: 100, nullable: true })
  accountName: string;

  @Column({ 
    name: 'status', 
    length: 20, 
    default: WithdrawalStatus.PENDING 
  })
  status: WithdrawalStatus;

  @Column({ name: 'transaction_no', length: 100, nullable: true })
  transactionNo: string;

  @Column({ name: 'remark', length: 500, nullable: true })
  remark: string;

  @Column({ name: 'processed_at', type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ name: 'processed_by', nullable: true })
  processedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
