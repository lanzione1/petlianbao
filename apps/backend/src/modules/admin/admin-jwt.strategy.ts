import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.secret'),
    });
  }

  async validate(payload: any) {
    // 管理员和商家共用同一个JWT，通过payload区分
    if (payload.adminId) {
      return {
        id: payload.adminId,
        username: payload.username,
        role: payload.role,
        isAdmin: true,
      };
    }
    return {
      id: payload.merchantId,
      openid: payload.openid,
      isAdmin: false,
    };
  }
}
