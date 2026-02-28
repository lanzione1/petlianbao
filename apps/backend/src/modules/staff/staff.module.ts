import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Staff } from './staff.entity';
import { OperationLog } from './operation-log.entity';
import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';
import { LogsController } from './logs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Staff, OperationLog])],
  controllers: [StaffController, LogsController],
  providers: [StaffService],
  exports: [StaffService],
})
export class StaffModule {}
