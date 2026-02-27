import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { H5Customer } from './h5-customer.entity';

@Entity('h5_pets')
export class H5Pet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @ManyToOne(() => H5Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: H5Customer;

  @Column({ length: 50 })
  name: string;

  @Column({ length: 20 })
  species: 'dog' | 'cat' | 'other';

  @Column({ length: 50, nullable: true })
  breed: string;

  @Column({ length: 10, nullable: true })
  gender: 'male' | 'female' | 'unknown';

  @Column({ name: 'birthday', type: 'date', nullable: true })
  birthday: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  weight: number;

  @Column({ length: 255, nullable: true })
  avatar: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}