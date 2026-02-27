import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './appointment.entity';
import { AppointmentStatus } from './appointment.entity';
import { Customer } from '../customer/customer.entity';
import { Service } from './service.entity';
import { Pet } from '../pet/pet.entity';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,
    @InjectRepository(Pet)
    private petsRepository: Repository<Pet>,
  ) {}

  async create(merchantId: string, data: {
    customerId: string;
    serviceId: string;
    appointmentTime: string;
    notes?: string;
    petIds?: string[];
  }): Promise<Appointment> {
    const service = await this.servicesRepository.findOne({
      where: { id: data.serviceId, merchantId },
    });
    
    if (!service) {
      throw new NotFoundException('服务项目不存在');
    }

    // 如果有petIds，获取宠物名字并添加到notes中
    let notesWithPets = data.notes || '';
    if (data.petIds && data.petIds.length > 0) {
      const pets = await this.petsRepository.findByIds(data.petIds);
      const petNames = pets.map(p => p.name).join('、');
      if (notesWithPets) {
        notesWithPets += ` | 宠物: ${petNames}`;
      } else {
        notesWithPets = `宠物: ${petNames}`;
      }
    }

    const appointment = this.appointmentsRepository.create({
      merchantId,
      customerId: data.customerId,
      serviceId: data.serviceId,
      appointmentTime: new Date(data.appointmentTime),
      notes: notesWithPets,
    });

    return this.appointmentsRepository.save(appointment);
  }

  async findAll(merchantId: string, date?: string): Promise<any[]> {
    let query = this.appointmentsRepository
      .createQueryBuilder('appointment')
      .where('appointment.merchantId = :merchantId', { merchantId });

    if (date) {
      // Use PostgreSQL date casting to avoid timezone issues
      query = query.andWhere('DATE(appointment.appointmentTime) = :date', { date });
    }

    const appointments = await query
      .orderBy('appointment.appointmentTime', 'ASC')
      .getMany();

    // 手动获取关联数据
    const result = await Promise.all(appointments.map(async (apt) => {
      const customer = await this.customersRepository.findOne({ 
        where: { id: apt.customerId } 
      });
      const service = await this.servicesRepository.findOne({ 
        where: { id: apt.serviceId } 
      });
      
      // 获取该客户的宠物列表
      const pets = await this.petsRepository.find({ 
        where: { customerId: apt.customerId } 
      });
      
      return {
        ...apt,
        customer: customer ? { 
          id: customer.id, 
          petName: customer.petName,
          phone: customer.phone
        } : null,
        pets: pets.map(p => ({
          id: p.id,
          name: p.name,
          species: p.species,
          breed: p.breed
        })),
        service: service ? { 
          id: service.id, 
          name: service.name, 
          price: service.price 
        } : null,
      };
    }));

    return result;
  }

  async findToday(merchantId: string): Promise<any[]> {
    // Use PostgreSQL CURRENT_DATE
    const query = this.appointmentsRepository
      .createQueryBuilder('appointment')
      .where('appointment.merchantId = :merchantId', { merchantId })
      .andWhere('DATE(appointment.appointmentTime) = CURRENT_DATE')
      .orderBy('appointment.appointmentTime', 'ASC');

    const appointments = await query.getMany();

    const result = await Promise.all(appointments.map(async (apt) => {
      const customer = await this.customersRepository.findOne({ 
        where: { id: apt.customerId } 
      });
      const service = await this.servicesRepository.findOne({ 
        where: { id: apt.serviceId } 
      });
      
      return {
        ...apt,
        customer: customer ? { 
          id: customer.id, 
          petName: customer.petName 
        } : null,
        service: service ? { 
          id: service.id, 
          name: service.name, 
          price: service.price 
        } : null,
      };
    }));

    return result;
  }

  async findOne(merchantId: string, id: string): Promise<Appointment> {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id, merchantId },
    });
    
    if (!appointment) {
      throw new NotFoundException('预约不存在');
    }
    return appointment;
  }

  async update(merchantId: string, id: string, data: {
    appointmentTime?: string;
    status?: AppointmentStatus;
    notes?: string;
    completedByStaffId?: string;
    completedByStaffName?: string;
    cancelReason?: string;
  }): Promise<Appointment> {
    const appointment = await this.findOne(merchantId, id);
    
    if (data.appointmentTime) {
      appointment.appointmentTime = new Date(data.appointmentTime);
    }
    
    if (data.completedByStaffId) {
      appointment.completedByStaffId = data.completedByStaffId;
    }
    
    if (data.completedByStaffName) {
      appointment.completedByStaffName = data.completedByStaffName;
    }
    
    // 如果状态变更为 completed，自动记录完成时间
    if (data.status === 'completed' && appointment.status !== 'completed') {
      appointment.completedAt = new Date();
    }
    
    // 如果是客户取消，记录取消信息
    if (data.status === 'cancelled_by_customer') {
      appointment.cancelledAt = new Date();
      appointment.needFollowUp = true;
      if (data.cancelReason) {
        appointment.cancelReason = data.cancelReason;
      }
    }
    
    // 如果是店家取消
    if (data.status === 'cancelled_by_merchant') {
      appointment.cancelledAt = new Date();
      appointment.needFollowUp = false;
      if (data.cancelReason) {
        appointment.cancelReason = data.cancelReason;
      }
    }
    
    Object.assign(appointment, data);
    return this.appointmentsRepository.save(appointment);
  }

  async remove(merchantId: string, id: string): Promise<void> {
    const appointment = await this.findOne(merchantId, id);
    await this.appointmentsRepository.remove(appointment);
  }
}
