import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Pet } from './pet.entity';
import { ReminderTemplate } from './reminder-template.entity';
import { Customer } from '../customer/customer.entity';

@Injectable()
export class PetService {
  constructor(
    @InjectRepository(Pet)
    private petsRepository: Repository<Pet>,
    @InjectRepository(ReminderTemplate)
    private templateRepo: Repository<ReminderTemplate>,
    private dataSource: DataSource,
  ) {}

  async findByCustomer(customerId: string): Promise<Pet[]> {
    return this.petsRepository.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Pet> {
    const pet = await this.petsRepository.findOne({ where: { id } });
    if (!pet) {
      throw new NotFoundException('宠物不存在');
    }
    return pet;
  }

  async create(merchantId: string, customerId: string, data: Partial<Pet>): Promise<Pet> {
    const petData = {
      ...data,
      birthday: data.birthday ? new Date(data.birthday as any) : undefined,
      nextVaccineDate: data.nextVaccineDate ? new Date(data.nextVaccineDate as any) : undefined,
      nextDewormDate: data.nextDewormDate ? new Date(data.nextDewormDate as any) : undefined,
    };
    const pet = this.petsRepository.create({
      ...petData,
      merchantId,
      customerId,
    });
    return this.petsRepository.save(pet);
  }

  async update(id: string, data: Partial<Pet>): Promise<Pet> {
    const petData = {
      ...data,
      birthday: data.birthday ? new Date(data.birthday as any) : undefined,
      nextVaccineDate: data.nextVaccineDate ? new Date(data.nextVaccineDate as any) : undefined,
      nextDewormDate: data.nextDewormDate ? new Date(data.nextDewormDate as any) : undefined,
    };
    await this.petsRepository.update(id, petData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.petsRepository.delete(id);
  }

  async getReminders(merchantId: string, type: string, days: number): Promise<any[]> {
    const petRepo = this.petsRepository;
    const customerRepo = this.dataSource.getRepository(Customer);
    
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    // 只查询当前商家的宠物
    const pets = await petRepo.find({
      where: { merchantId }
    });
    
    const results: any[] = [];
    
    for (const pet of pets) {
      const customer = await customerRepo.findOne({ where: { id: pet.customerId } });
      
      if ((!type || type === 'all' || type === 'birthday') && pet.birthday) {
        const birthday = new Date(pet.birthday);
        birthday.setFullYear(now.getFullYear());
        if (birthday >= now && birthday <= futureDate) {
          results.push({
            ...pet,
            reminderType: 'birthday',
            reminderDate: birthday.toISOString().split('T')[0],
            daysLeft: Math.ceil((birthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
            customer: customer ? {
              name: customer.petName,
              phone: customer.phone
            } : null
          });
        }
      }
      
      if ((!type || type === 'all' || type === 'vaccine') && pet.nextVaccineDate) {
        const vaccineDate = new Date(pet.nextVaccineDate);
        if (vaccineDate >= now && vaccineDate <= futureDate) {
          results.push({
            ...pet,
            reminderType: 'vaccine',
            reminderDate: vaccineDate.toISOString().split('T')[0],
            daysLeft: Math.ceil((vaccineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
            customer: customer ? {
              name: customer.petName,
              phone: customer.phone
            } : null
          });
        }
      }
      
      if ((!type || type === 'all' || type === 'deworm') && pet.nextDewormDate) {
        const dewormDate = new Date(pet.nextDewormDate);
        if (dewormDate >= now && dewormDate <= futureDate) {
          results.push({
            ...pet,
            reminderType: 'deworm',
            reminderDate: dewormDate.toISOString().split('T')[0],
            daysLeft: Math.ceil((dewormDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
            customer: customer ? {
              name: customer.petName,
              phone: customer.phone
            } : null
          });
        }
      }
    }
    
    return results.sort((a, b) => a.daysLeft - b.daysLeft);
  }

  async getTemplates(merchantId: string): Promise<ReminderTemplate> {
    let template = await this.templateRepo.findOne({ where: { merchantId } });
    if (!template) {
      template = this.templateRepo.create({ merchantId });
      await this.templateRepo.save(template);
    }
    return template;
  }

  async updateTemplates(merchantId: string, data: Partial<ReminderTemplate>): Promise<ReminderTemplate> {
    let template = await this.templateRepo.findOne({ where: { merchantId } });
    if (!template) {
      template = this.templateRepo.create({ merchantId });
    }
    Object.assign(template, data);
    return this.templateRepo.save(template);
  }

  async sendReminders(merchantId: string, petIds: string[], type: string, message: string): Promise<{ total: number; sent: number }> {
    return { total: petIds.length, sent: petIds.length };
  }
}
