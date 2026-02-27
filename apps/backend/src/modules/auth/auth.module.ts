import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Merchant } from '../merchant/merchant.entity';
import { Staff } from '../staff/staff.entity';
import { H5Customer } from '../h5-customer/h5-customer.entity';
import { Customer } from '../customer/customer.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { H5JwtStrategy } from './strategies/h5-jwt.strategy';
import { WechatService } from './wechat.service';
import { H5AuthController } from './h5-auth.controller';
import { StaffModule } from '../staff/staff.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Merchant, Staff, H5Customer, Customer]),
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
    StaffModule,
  ],
  controllers: [AuthController, H5AuthController],
  providers: [AuthService, JwtStrategy, H5JwtStrategy, WechatService],
  exports: [AuthService, WechatService],
})
export class AuthModule {}
