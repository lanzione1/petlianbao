import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './service.entity';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,
  ) {}

  async create(merchantId: string, data: Partial<Service>): Promise<Service> {
    const service = this.servicesRepository.create({
      ...data,
      merchantId,
    });
    return this.servicesRepository.save(service);
  }

  async findAll(merchantId: string): Promise<Service[]> {
    return this.servicesRepository.find({
      where: { merchantId },
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async findOne(merchantId: string, id: string): Promise<Service> {
    const service = await this.servicesRepository.findOne({
      where: { id, merchantId },
    });
    if (!service) {
      throw new NotFoundException('服务项目不存在');
    }
    return service;
  }

  async update(merchantId: string, id: string, data: Partial<Service>): Promise<Service> {
    const service = await this.findOne(merchantId, id);
    Object.assign(service, data);
    return this.servicesRepository.save(service);
  }

  async remove(merchantId: string, id: string): Promise<void> {
    const service = await this.findOne(merchantId, id);
    await this.servicesRepository.remove(service);
  }
}
