import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ServicesService } from '../appointment/services.service';
import { AppointmentsService } from '../appointment/appointments.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../customer/customer.entity';
import { Merchant } from '../merchant/merchant.entity';
import { Service } from '../appointment/service.entity';
import { IsString, IsOptional } from 'class-validator';

class PublicAppointmentDto {
  @IsString()
  merchantId: string;

  @IsString()
  serviceId: string;

  @IsString()
  customerName: string;

  @IsString()
  phone: string;

  @IsString()
  petName: string;

  @IsOptional()
  @IsString()
  petBreed?: string;

  @IsString()
  appointmentTime: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

@Controller('public')
export class PublicController {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly appointmentsService: AppointmentsService,
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
    @InjectRepository(Merchant)
    private merchantsRepository: Repository<Merchant>,
  ) {}

  @Get('merchants/:id')
  async getMerchantInfo(@Param('id') id: string) {
    const merchant = await this.merchantsRepository.findOne({ where: { id } });
    if (!merchant) {
      return { id, shopName: '宠物店', address: '' };
    }
    return {
      id: merchant.id,
      shopName: merchant.shopName,
      address: merchant.address,
      phone: merchant.phone,
    };
  }

  @Get('merchants/:id/services')
  async getMerchantServices(@Param('id') id: string) {
    return this.servicesService.findAll(id);
  }

  @Get('services/:merchantId')
  async getServices(@Param('merchantId') merchantId: string) {
    return this.servicesService.findAll(merchantId);
  }

  @Get('appointments/slots')
  async getAvailableSlots(
    @Query('merchantId') merchantId: string,
    @Query('serviceId') serviceId: string,
    @Query('date') date: string,
  ) {
    const slots = [];
    for (let hour = 9; hour <= 18; hour++) {
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        available: Math.random() > 0.3,
      });
    }
    return slots;
  }

  @Post('appointments')
  async createAppointment(@Body() data: PublicAppointmentDto) {
    let customer = await this.customersRepository.findOne({
      where: { phone: data.phone, merchantId: data.merchantId },
    });

    if (!customer) {
      customer = this.customersRepository.create({
        merchantId: data.merchantId,
        petName: data.petName,
        petBreed: data.petBreed,
        phone: data.phone,
      });
      await this.customersRepository.save(customer);
    }

    const appointment = await this.appointmentsService.create(data.merchantId, {
      customerId: customer.id,
      serviceId: data.serviceId,
      appointmentTime: data.appointmentTime,
      notes: data.notes,
    });

    return {
      success: true,
      appointmentId: appointment.id,
    };
  }
}
