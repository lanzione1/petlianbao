import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { StaffService } from '../../staff/staff.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
    private staffService: StaffService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.secret'),
    });
  }

  async validate(payload: { merchantId: string; openid: string; staffId?: string }) {
    if (payload.staffId) {
      const staff = await this.staffService.findOne(payload.staffId);
      if (!staff || staff.status === 'disabled') {
        return null;
      }
      return {
        merchantId: staff.merchantId,
        staffId: staff.id,
        openid: staff.openid,
        nickname: staff.nickname,
        role: staff.role,
      };
    }
    
    const merchant = await this.authService.validateUser(payload.merchantId);
    if (!merchant) {
      return null;
    }
    return { merchantId: merchant.id, openid: merchant.openid, role: 'admin', merchant };
  }
}
