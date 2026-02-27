import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Admin } from './admin.entity';
import { AdminLog } from './admin-log.entity';
import { Merchant } from '../merchant/merchant.entity';
import { Customer } from '../customer/customer.entity';
import { Appointment } from '../appointment/appointment.entity';
import { Transaction } from '../billing/transaction.entity';
import { Service } from '../appointment/service.entity';
import { Media } from '../media/media.entity';
import { Withdrawal } from '../withdrawal/withdrawal.entity';
import { Package } from '../package/package.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminJwtStrategy } from './admin-jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin, AdminLog, Merchant, Customer, Appointment, Transaction, Service, Media, Withdrawal, Package]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('jwt.secret'),
        signOptions: {
          expiresIn: configService.get('jwt.expiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminJwtStrategy],
  exports: [AdminService],
})
export class AdminModule {}
