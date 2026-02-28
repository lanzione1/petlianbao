import { IsString, IsOptional, IsUUID, IsDateString } from 'class-validator';

export class CreateH5AppointmentDto {
  @IsUUID()
  merchantId: string;

  @IsUUID()
  @IsOptional()
  petId?: string;

  @IsUUID()
  serviceId: string;

  @IsDateString()
  appointmentTime: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class RescheduleDto {
  @IsDateString()
  proposedTime: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CancelDto {
  @IsString()
  @IsOptional()
  reason?: string;
}

export class ConfirmRescheduleDto {
  @IsString()
  @IsOptional()
  notes?: string;
}
