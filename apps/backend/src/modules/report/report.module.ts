import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../billing/transaction.entity';
import { Customer } from '../customer/customer.entity';
import { Service } from '../appointment/service.entity';
import { Appointment } from '../appointment/appointment.entity';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Customer, Service, Appointment])],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
