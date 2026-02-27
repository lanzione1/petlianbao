import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AppointmentsService } from './appointments.service';
import { IsUUID, IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';

class CreateAppointmentDto {
  @IsUUID()
  customerId: string;

  @IsUUID()
  serviceId: string;

  @IsDateString()
  appointmentTime: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  petIds?: string[];
}

class UpdateAppointmentDto {
  @IsOptional()
  @IsDateString()
  appointmentTime?: string;

  @IsOptional()
  @IsEnum(['pending', 'completed', 'paid', 'cancelled_by_merchant', 'cancelled_by_customer'])
  status?: 'pending' | 'completed' | 'paid' | 'cancelled_by_merchant' | 'cancelled_by_customer';

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  completedByStaffId?: string;

  @IsOptional()
  @IsString()
  completedByStaffName?: string;

  @IsOptional()
  @IsString()
  cancelReason?: string;
}

@Controller('appointments')
@UseGuards(AuthGuard('jwt'))
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  create(@Request() req, @Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.create(req.user.merchantId, createAppointmentDto);
  }

  @Get()
  findAll(@Request() req, @Query('date') date?: string) {
    return this.appointmentsService.findAll(req.user.merchantId, date);
  }

  @Get('today')
  findToday(@Request() req) {
    return this.appointmentsService.findToday(req.user.merchantId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.appointmentsService.findOne(req.user.merchantId, id);
  }

  @Put(':id')
  update(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(req.user.merchantId, id, updateAppointmentDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.appointmentsService.remove(req.user.merchantId, id);
  }
}
