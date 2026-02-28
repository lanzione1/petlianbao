import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './customer.entity';
import { Transaction } from '../billing/transaction.entity';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { StaffModule } from '../staff/staff.module';

@Module({
  imports: [TypeOrmModule.forFeature([Customer, Transaction]), StaffModule],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomerModule {}
