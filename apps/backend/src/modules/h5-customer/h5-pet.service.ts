import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { H5Pet } from '../h5-customer/h5-pet.entity';
import { H5Customer } from '../h5-customer/h5-customer.entity';

@Injectable()
export class H5PetService {
  constructor(
    @InjectRepository(H5Pet)
    private petRepo: Repository<H5Pet>,
    @InjectRepository(H5Customer)
    private customerRepo: Repository<H5Customer>,
  ) {}

  async findAll(customerId: string) {
    return this.petRepo.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(petId: string, customerId: string) {
    const pet = await this.petRepo.findOne({
      where: { id: petId, customerId },
    });

    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    return pet;
  }

  async create(customerId: string, data: Partial<H5Pet>) {
    const customer = await this.customerRepo.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const pet = this.petRepo.create({
      ...data,
      customerId,
    });

    return this.petRepo.save(pet);
  }

  async update(petId: string, customerId: string, data: Partial<H5Pet>) {
    const pet = await this.findOne(petId, customerId);

    Object.assign(pet, data);

    return this.petRepo.save(pet);
  }

  async delete(petId: string, customerId: string) {
    const pet = await this.findOne(petId, customerId);
    await this.petRepo.remove(pet);
    return { success: true };
  }
}
