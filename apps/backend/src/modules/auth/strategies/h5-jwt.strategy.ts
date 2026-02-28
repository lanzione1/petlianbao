import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { H5Customer } from '../../h5-customer/h5-customer.entity';

@Injectable()
export class H5JwtStrategy extends PassportStrategy(Strategy, 'h5-customer') {
  constructor(
    private configService: ConfigService,
    @InjectRepository(H5Customer)
    private customerRepo: Repository<H5Customer>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.secret'),
    });
  }

  async validate(payload: { sub: string; merchantId: string; type: string }) {
    if (payload.type !== 'h5_customer') {
      throw new UnauthorizedException('Invalid token type');
    }

    const customer = await this.customerRepo.findOne({
      where: { id: payload.sub },
    });

    if (!customer) {
      throw new UnauthorizedException('Customer not found');
    }

    return {
      customerId: customer.id,
      merchantId: payload.merchantId,
      customer,
    };
  }
}
