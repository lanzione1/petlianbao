import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Customer } from '../customer/customer.entity';
import { Service } from './service.entity';
import { H5Customer } from '../h5-customer/h5-customer.entity';
import { H5Pet } from '../h5-customer/h5-pet.entity';

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'reschedule'
  | 'in_service'
  | 'completed'
  | 'paid'
  | 'cancelled_by_merchant'
  | 'cancelled_by_customer';

export type AppointmentCreator = 'customer' | 'merchant';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'merchant_id' })
  merchantId: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ name: 'service_id' })
  serviceId: string;

  @Column({ name: 'appointment_time', type: 'timestamp' })
  appointmentTime: Date;

  @Column({ default: 'pending', length: 30 })
  status: AppointmentStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'reminder_sent', default: false })
  reminderSent: boolean;

  @Column({ name: 'completed_by_staff_id', nullable: true })
  completedByStaffId: string;

  @Column({ name: 'completed_by_staff_name', nullable: true, length: 50 })
  completedByStaffName: string;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ name: 'cancel_reason', type: 'text', nullable: true })
  cancelReason: string;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @Column({ name: 'need_follow_up', default: false })
  needFollowUp: boolean;

  @Column({ name: 'followed_up_at', type: 'timestamp', nullable: true })
  followedUpAt: Date;

  @Column({ name: 'h5_customer_id', nullable: true })
  h5CustomerId: string;

  @ManyToOne(() => H5Customer, { nullable: true })
  @JoinColumn({ name: 'h5_customer_id' })
  h5Customer: H5Customer;

  @Column({ name: 'h5_pet_id', nullable: true })
  h5PetId: string;

  @ManyToOne(() => H5Pet, { nullable: true })
  @JoinColumn({ name: 'h5_pet_id' })
  h5Pet: H5Pet;

  @Column({ name: 'proposed_time', type: 'timestamp', nullable: true })
  proposedTime: Date;

  @Column({ name: 'proposed_by', length: 20, nullable: true })
  proposedBy: 'customer' | 'merchant';

  @Column({ name: 'created_by', length: 20, default: 'merchant' })
  createdBy: AppointmentCreator;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => Service)
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
