import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Customer } from '../customer/customer.entity';

@Entity('pets')
export class Pet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'merchant_id', nullable: true })
  merchantId: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ length: 50 })
  name: string;

  @Column({ length: 20 })
  species: 'dog' | 'cat' | 'other';

  @Column({ length: 50 })
  breed: string;

  @Column({ type: 'decimal', precision: 5, scale: 1, nullable: true })
  weight: number;

  @Column({ type: 'date', nullable: true })
  birthday: Date;

  @Column({ type: 'text', nullable: true })
  feeding: string;

  @Column({ type: 'text', nullable: true })
  allergy: string;

  @Column({ type: 'text', nullable: true })
  behavior: string;

  @Column({ length: 255, nullable: true })
  photo: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'next_vaccine_date', type: 'date', nullable: true })
  nextVaccineDate: Date;

  @Column({ name: 'next_deworm_date', type: 'date', nullable: true })
  nextDewormDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
