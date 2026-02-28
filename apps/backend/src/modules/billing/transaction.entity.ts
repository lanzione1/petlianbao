import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export type PaymentMethod = 'wechat' | 'alipay' | 'cash' | 'member';
export type TransactionStatus = 'completed' | 'refunded';

export interface TransactionItem {
  name: string;
  price: number;
  quantity: number;
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'merchant_id' })
  merchantId: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ name: 'appointment_id', nullable: true })
  appointmentId: string;

  @Column({ type: 'json' })
  items: TransactionItem[];

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ name: 'payment_method', length: 20 })
  paymentMethod: PaymentMethod;

  @Column({ default: 'completed', length: 20 })
  status: TransactionStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
