import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'merchant_id' })
  merchantId: string;

  @Column({ name: 'openid', length: 64, nullable: true })
  openid: string;

  @Column({ name: 'pet_name', length: 50 })
  petName: string;

  @Column({ name: 'pet_breed', length: 50, nullable: true })
  petBreed: string;

  @Column({ name: 'pet_birthday', type: 'date', nullable: true })
  petBirthday: Date;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 10, nullable: true })
  gender: 'male' | 'female' | 'unknown';

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'json', nullable: true })
  tags: string[];

  @Column({ name: 'total_spent', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalSpent: number;

  @Column({ name: 'visit_count', default: 0 })
  visitCount: number;

  @Column({ name: 'last_visit_at', nullable: true, type: 'timestamp' })
  lastVisitAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
