import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Merchant } from './merchant.entity';
import { MerchantService } from './merchant.service';
import { MerchantController } from './merchant.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Merchant]), ConfigModule],
  controllers: [MerchantController],
  providers: [MerchantService],
  exports: [MerchantService],
})
export class MerchantModule {}
