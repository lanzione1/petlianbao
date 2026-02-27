import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { H5AppointmentService } from './h5-appointment.service';
import {
  CreateH5AppointmentDto,
  RescheduleDto,
  CancelDto,
  ConfirmRescheduleDto,
} from './h5-appointment.dto';
import { H5CustomerGuard } from '../auth/guards/h5-customer.guard';

@Controller('h5/appointments')
@UseGuards(H5CustomerGuard)
export class H5AppointmentController {
  constructor(private appointmentService: H5AppointmentService) {}

  @Get()
  async findAll(@Request() req, @Query('status') status?: string) {
    const customerId = req.user.customerId;
    const appointments = await this.appointmentService.findAll(customerId, status);
    return { success: true, data: appointments };
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    const customerId = req.user.customerId;
    const appointment = await this.appointmentService.findOne(id, customerId);
    return { success: true, data: appointment };
  }

  @Post()
  async create(@Request() req, @Body() dto: CreateH5AppointmentDto) {
    const customerId = req.user.customerId;
    const appointment = await this.appointmentService.create(customerId, dto);
    return { success: true, data: appointment };
  }

  @Put(':id/reschedule')
  async proposeReschedule(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: RescheduleDto,
  ) {
    const customerId = req.user.customerId;
    const appointment = await this.appointmentService.proposeReschedule(
      id,
      customerId,
      dto,
    );
    return { success: true, data: appointment };
  }

  @Put(':id/confirm')
  async confirm(@Request() req, @Param('id') id: string) {
    const customerId = req.user.customerId;
    const appointment = await this.appointmentService.confirm(id, customerId);
    return { success: true, data: appointment };
  }

  @Put(':id/accept')
  async acceptReschedule(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: ConfirmRescheduleDto,
  ) {
    const customerId = req.user.customerId;
    const appointment = await this.appointmentService.confirmReschedule(
      id,
      customerId,
      dto,
    );
    return { success: true, data: appointment };
  }

  @Put(':id/reject')
  async rejectReschedule(@Request() req, @Param('id') id: string) {
    const customerId = req.user.customerId;
    const appointment = await this.appointmentService.rejectReschedule(
      id,
      customerId,
    );
    return { success: true, data: appointment };
  }

  @Put(':id/cancel')
  async cancel(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: CancelDto,
  ) {
    const customerId = req.user.customerId;
    const result = await this.appointmentService.cancel(id, customerId, dto);
    return result;
  }
}