import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Appointment } from './appointment.entity';
import { AppointmentHistory, HistoryAction, OperatorType } from './appointment-history.entity';
import { H5Customer } from '../h5-customer/h5-customer.entity';
import { H5Pet } from '../h5-customer/h5-pet.entity';
import { Customer } from '../customer/customer.entity';
import { Service } from './service.entity';
import {
  CreateH5AppointmentDto,
  RescheduleDto,
  CancelDto,
  ConfirmRescheduleDto,
} from './h5-appointment.dto';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class H5AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,
    @InjectRepository(AppointmentHistory)
    private historyRepo: Repository<AppointmentHistory>,
    @InjectRepository(H5Customer)
    private customerRepo: Repository<H5Customer>,
    @InjectRepository(Customer)
    private formalCustomerRepo: Repository<Customer>,
    @InjectRepository(H5Pet)
    private petRepo: Repository<H5Pet>,
    @InjectRepository(Service)
    private serviceRepo: Repository<Service>,
    private notificationService: NotificationService,
    private dataSource: DataSource,
  ) {}

  async create(customerId: string, dto: CreateH5AppointmentDto) {
    const customer = await this.customerRepo.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const service = await this.serviceRepo.findOne({
      where: { id: dto.serviceId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    let pet: H5Pet | null = null;
    if (dto.petId) {
      pet = await this.petRepo.findOne({
        where: { id: dto.petId, customerId },
      });
      if (!pet) {
        throw new NotFoundException('Pet not found');
      }
    }

    // 查找或创建正式客户记录（用于关联预约）
    let formalCustomer = await this.formalCustomerRepo.findOne({
      where: { merchantId: dto.merchantId, openid: customer.openid },
    });

    if (!formalCustomer) {
      // 创建正式客户记录
      formalCustomer = this.formalCustomerRepo.create({
        merchantId: dto.merchantId,
        openid: customer.openid,
        petName: customer.nickname || 'H5客户',
        phone: customer.phone,
        gender: 'unknown',
        notes: `来源：H5微信授权 | 客户昵称：${customer.nickname || '未设置'}`,
        tags: ['H5客户'],
      });
      await this.formalCustomerRepo.save(formalCustomer);
    }

    const appointment = this.appointmentRepo.create({
      merchantId: dto.merchantId,
      customerId: formalCustomer.id, // 关联正式客户（非空字段）
      h5CustomerId: customerId, // 关联H5客户
      h5PetId: dto.petId || null,
      serviceId: dto.serviceId,
      appointmentTime: new Date(dto.appointmentTime),
      status: 'pending',
      notes: dto.notes,
      createdBy: 'customer',
    });

    await this.appointmentRepo.save(appointment);

    await this.recordHistory(
      appointment.id,
      'create',
      'customer',
      customerId,
      customer.nickname || 'Customer',
      null,
      appointment.appointmentTime,
      dto.notes,
    );

    await this.notificationService.sendAppointmentNotification(
      'create',
      {
        ...appointment,
        customer,
        pet,
        service,
      },
      'merchant',
    );

    return this.findOne(appointment.id, customerId);
  }

  async findAll(customerId: string, status?: string) {
    const query = this.appointmentRepo
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.service', 'service')
      .leftJoinAndSelect('appointment.h5Customer', 'customer')
      .leftJoinAndSelect('appointment.h5Pet', 'pet')
      .where('appointment.h5CustomerId = :customerId', { customerId })
      .orderBy('appointment.appointmentTime', 'DESC');

    if (status) {
      query.andWhere('appointment.status = :status', { status });
    }

    return query.getMany();
  }

  async findOne(appointmentId: string, customerId: string) {
    const appointment = await this.appointmentRepo
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.service', 'service')
      .leftJoinAndSelect('appointment.h5Customer', 'customer')
      .leftJoinAndSelect('appointment.h5Pet', 'pet')
      .leftJoinAndSelect('appointment.merchant', 'merchant')
      .leftJoinAndMapMany(
        'appointment.history',
        AppointmentHistory,
        'history',
        'history.appointmentId = appointment.id',
      )
      .where('appointment.id = :appointmentId', { appointmentId })
      .andWhere('appointment.h5CustomerId = :customerId', { customerId })
      .getOne();

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return appointment;
  }

  async proposeReschedule(appointmentId: string, customerId: string, dto: RescheduleDto) {
    const appointment = await this.findOne(appointmentId, customerId);
    const customer = await this.customerRepo.findOne({ where: { id: customerId } });

    if (!['pending', 'confirmed', 'reschedule'].includes(appointment.status)) {
      throw new BadRequestException('Cannot reschedule this appointment');
    }

    const oldTime = appointment.appointmentTime;
    appointment.proposedTime = new Date(dto.proposedTime);
    appointment.proposedBy = 'customer';
    appointment.status = 'reschedule';
    appointment.notes = dto.notes || appointment.notes;

    await this.appointmentRepo.save(appointment);

    await this.recordHistory(
      appointmentId,
      'reschedule',
      'customer',
      customerId,
      customer?.nickname || 'Customer',
      oldTime,
      appointment.proposedTime,
      dto.notes,
    );

    return this.findOne(appointmentId, customerId);
  }

  async confirmReschedule(appointmentId: string, customerId: string, dto: ConfirmRescheduleDto) {
    const appointment = await this.findOne(appointmentId, customerId);
    const customer = await this.customerRepo.findOne({ where: { id: customerId } });

    if (appointment.status !== 'reschedule') {
      throw new BadRequestException('Appointment is not in reschedule status');
    }

    if (appointment.proposedBy === 'customer') {
      throw new BadRequestException('Cannot confirm your own reschedule proposal');
    }

    const oldTime = appointment.appointmentTime;
    appointment.appointmentTime = appointment.proposedTime;
    appointment.proposedTime = null;
    appointment.proposedBy = null;
    appointment.status = 'confirmed';
    appointment.notes = dto.notes || appointment.notes;

    await this.appointmentRepo.save(appointment);

    await this.recordHistory(
      appointmentId,
      'accept',
      'customer',
      customerId,
      customer?.nickname || 'Customer',
      oldTime,
      appointment.appointmentTime,
      dto.notes,
    );

    return this.findOne(appointmentId, customerId);
  }

  async rejectReschedule(appointmentId: string, customerId: string) {
    const appointment = await this.findOne(appointmentId, customerId);
    const customer = await this.customerRepo.findOne({ where: { id: customerId } });

    if (appointment.status !== 'reschedule') {
      throw new BadRequestException('Appointment is not in reschedule status');
    }

    if (appointment.proposedBy === 'customer') {
      throw new BadRequestException('Cannot reject your own reschedule proposal');
    }

    appointment.proposedTime = null;
    appointment.proposedBy = null;
    appointment.status = 'confirmed';

    await this.appointmentRepo.save(appointment);

    await this.recordHistory(
      appointmentId,
      'reject',
      'customer',
      customerId,
      customer?.nickname || 'Customer',
      null,
      null,
      'Rejected reschedule proposal',
    );

    return this.findOne(appointmentId, customerId);
  }

  async confirm(appointmentId: string, customerId: string) {
    const appointment = await this.findOne(appointmentId, customerId);
    const customer = await this.customerRepo.findOne({ where: { id: customerId } });

    if (appointment.status !== 'pending' && appointment.status !== 'reschedule') {
      throw new BadRequestException('Appointment cannot be confirmed');
    }

    if (appointment.status === 'reschedule' && appointment.proposedBy === 'customer') {
      return this.confirmReschedule(appointmentId, customerId, { notes: '' });
    }

    appointment.status = 'confirmed';
    await this.appointmentRepo.save(appointment);

    await this.recordHistory(
      appointmentId,
      'confirm',
      'customer',
      customerId,
      customer?.nickname || 'Customer',
      null,
      null,
      'Confirmed appointment',
    );

    return this.findOne(appointmentId, customerId);
  }

  async cancel(appointmentId: string, customerId: string, dto: CancelDto) {
    const appointment = await this.findOne(appointmentId, customerId);
    const customer = await this.customerRepo.findOne({ where: { id: customerId } });

    if (!['pending', 'confirmed', 'reschedule'].includes(appointment.status)) {
      throw new BadRequestException('Cannot cancel this appointment');
    }

    appointment.status = 'cancelled_by_customer';
    appointment.cancelReason = dto.reason;
    appointment.cancelledAt = new Date();
    await this.appointmentRepo.save(appointment);

    await this.recordHistory(
      appointmentId,
      'cancel',
      'customer',
      customerId,
      customer?.nickname || 'Customer',
      null,
      null,
      dto.reason,
    );

    await this.notificationService.sendAppointmentNotification('cancel', appointment, 'merchant');

    return { success: true, message: 'Appointment cancelled' };
  }

  private async recordHistory(
    appointmentId: string,
    action: HistoryAction,
    operatorType: OperatorType,
    operatorId: string,
    operatorName: string,
    oldTime: Date | null,
    newTime: Date | null,
    notes: string | undefined,
  ) {
    const history = this.historyRepo.create({
      appointmentId,
      action,
      operatorType,
      operatorId,
      operatorName,
      oldTime,
      newTime,
      notes,
    });
    await this.historyRepo.save(history);
  }
}
