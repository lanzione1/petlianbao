import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Campaign } from './campaign.entity';
import { Customer } from '../customer/customer.entity';
import { MarketingService } from './marketing.service';
import { MarketingController } from './marketing.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Campaign, Customer])],
  controllers: [MarketingController],
  providers: [MarketingService],
  exports: [MarketingService],
})
export class MarketingModule {}
