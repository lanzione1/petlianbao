import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from '../appointment/service.entity';
import { Appointment } from '../appointment/appointment.entity';
import { Customer } from '../customer/customer.entity';
import { Merchant } from '../merchant/merchant.entity';
import { Pet } from '../pet/pet.entity';
import { ServicesService } from '../appointment/services.service';
import { AppointmentsService } from '../appointment/appointments.service';
import { PublicController } from './public.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Service, Appointment, Customer, Merchant, Pet])],
  controllers: [PublicController],
  providers: [ServicesService, AppointmentsService],
})
export class PublicModule {}
