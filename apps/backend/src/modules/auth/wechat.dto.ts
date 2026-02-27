import { IsString, IsOptional } from 'class-validator';

export class WechatLoginDto {
  @IsString()
  code: string;

  @IsString()
  merchantId: string;
}

export class BindPhoneDto {
  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  code?: string;
}