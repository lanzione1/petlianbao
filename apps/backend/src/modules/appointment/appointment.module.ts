import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './service.entity';
import { Appointment } from './appointment.entity';
import { AppointmentHistory } from './appointment-history.entity';
import { Customer } from '../customer/customer.entity';
import { Pet } from '../pet/pet.entity';
import { H5Customer } from '../h5-customer/h5-customer.entity';
import { H5Pet } from '../h5-customer/h5-pet.entity';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { H5AppointmentService } from './h5-appointment.service';
import { H5AppointmentController } from './h5-appointment.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Service,
      Appointment,
      AppointmentHistory,
      Customer,
      Pet,
      H5Customer,
      H5Pet,
    ]),
    NotificationModule,
  ],
  controllers: [ServicesController, AppointmentsController, H5AppointmentController],
  providers: [ServicesService, AppointmentsService, H5AppointmentService],
  exports: [ServicesService, AppointmentsService, H5AppointmentService],
})
export class AppointmentModule {}
