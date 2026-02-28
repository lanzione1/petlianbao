import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Appointment } from './appointment.entity';

export type HistoryAction =
  | 'create'
  | 'confirm'
  | 'reschedule'
  | 'accept'
  | 'reject'
  | 'cancel'
  | 'complete';

export type OperatorType = 'customer' | 'merchant';

@Entity('appointment_histories')
export class AppointmentHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'appointment_id' })
  appointmentId: string;

  @ManyToOne(() => Appointment)
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @Column({ length: 20 })
  action: HistoryAction;

  @Column({ name: 'operator_type', length: 20 })
  operatorType: OperatorType;

  @Column({ name: 'operator_id' })
  operatorId: string;

  @Column({ name: 'operator_name', length: 50 })
  operatorName: string;

  @Column({ name: 'old_time', type: 'timestamp', nullable: true })
  oldTime: Date;

  @Column({ name: 'new_time', type: 'timestamp', nullable: true })
  newTime: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
