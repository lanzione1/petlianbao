import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, DataSource } from 'typeorm';
import { Customer } from './customer.entity';
import { Transaction } from '../billing/transaction.entity';
import { Pet } from '../pet/pet.entity';
import { Appointment } from '../appointment/appointment.entity';
import { StaffService } from '../staff/staff.service';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    private staffService: StaffService,
    private dataSource: DataSource,
  ) {}

  async create(merchantId: string, data: Partial<Customer>, staffInfo?: { staffId: string; staffName: string }): Promise<Customer> {
    const customer = this.customersRepository.create({
      ...data,
      merchantId,
    });
    const result = await this.customersRepository.save(customer);
    
    if (staffInfo) {
      await this.staffService.log(merchantId, staffInfo.staffId, staffInfo.staffName, 'create', 'customer', result.id, {
        petName: result.petName,
        phone: result.phone,
      });
    }
    
    return result;
  }

  async findAll(merchantId: string, query: {
    search?: string;
    tag?: string;
    inactive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ list: Customer[]; total: number }> {
    const { search, tag, inactive, page = 1, limit = 20 } = query;
    
    const queryBuilder = this.customersRepository
      .createQueryBuilder('customer')
      .where('customer.merchantId = :merchantId', { merchantId });

    if (search) {
      queryBuilder.andWhere(
        '(customer.petName LIKE :search OR customer.phone LIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (tag) {
      queryBuilder.andWhere('customer.tags @> :tag', { tag: JSON.stringify([tag]) });
    }

    if (inactive) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      queryBuilder.andWhere('customer.lastVisitAt < :date', { date: thirtyDaysAgo });
    }

    const total = await queryBuilder.getCount();
    
    const list = await queryBuilder
      .orderBy('customer.lastVisitAt', 'DESC', 'NULLS LAST')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const customerIds = list.map(c => c.id);
    if (customerIds.length > 0) {
      const petCounts = await this.dataSource.getRepository(Pet)
        .createQueryBuilder('pet')
        .select('pet.customerId', 'customerId')
        .addSelect('COUNT(*)', 'count')
        .where('pet.customerId IN (:...customerIds)', { customerIds })
        .groupBy('pet.customerId')
        .getRawMany();

      const countMap = new Map(petCounts.map((p: any) => [p.customerId, parseInt(p.count)]));
      for (const customer of list) {
        (customer as any).petCount = countMap.get(customer.id) || 0;
      }
    }

    return { list, total };
  }

  async findOne(merchantId: string, id: string): Promise<Customer> {
    const customer = await this.customersRepository.findOne({
      where: { id, merchantId },
    });
    
    if (!customer) {
      throw new NotFoundException('客户不存在');
    }

    const petRepo = this.dataSource.getRepository(Pet);
    const pets = await petRepo.find({ where: { customerId: id } });
    
    return { ...customer, pets } as any;
  }

  async update(merchantId: string, id: string, data: Partial<Customer>): Promise<Customer> {
    const customer = await this.findOne(merchantId, id);
    Object.assign(customer, data);
    return this.customersRepository.save(customer);
  }

  async remove(merchantId: string, id: string): Promise<void> {
    console.log(`[Delete Customer] Starting - merchantId: ${merchantId}, customerId: ${id}`);
    
    const customer = await this.customersRepository.findOne({
      where: { id, merchantId },
    });
    if (!customer) {
      console.log(`[Delete Customer] Customer not found`);
      throw new NotFoundException('客户不存在');
    }
    console.log(`[Delete Customer] Found customer:`, { id: customer.id, openid: customer.openid, petName: customer.petName });

    // 检查是否有未完成的预约（包括正式客户和H5客户的预约）
    const appointmentRepo = this.dataSource.getRepository(Appointment);
    
    // 检查正式客户预约
    const pendingAppointments = await appointmentRepo.find({
      where: { 
        customerId: id, 
        merchantId,
        status: 'pending'
      }
    });
    console.log(`[Delete Customer] Pending appointments (customerId): ${pendingAppointments.length}`);

    // 检查H5客户预约（通过openid关联）
    let h5PendingAppointments: any[] = [];
    if (customer.openid) {
      console.log(`[Delete Customer] Checking H5 appointments with openid: ${customer.openid}`);
      try {
        const h5CustomerRepo = this.dataSource.getRepository('H5Customer');
        const h5Customer = await h5CustomerRepo.findOne({
          where: { openid: customer.openid, merchantId }
        });
        console.log(`[Delete Customer] H5 customer found:`, h5Customer ? 'yes' : 'no');
        if (h5Customer) {
          h5PendingAppointments = await appointmentRepo.find({
            where: { 
              h5CustomerId: (h5Customer as any).id, 
              merchantId,
              status: 'pending'
            }
          });
          console.log(`[Delete Customer] Pending appointments (h5CustomerId): ${h5PendingAppointments.length}`);
        }
      } catch (error) {
        console.error(`[Delete Customer] Error checking H5 appointments:`, error.message);
      }
    }

    const totalPending = pendingAppointments.length + h5PendingAppointments.length;
    if (totalPending > 0) {
      console.log(`[Delete Customer] Rejected - ${totalPending} pending appointments`);
      throw new BadRequestException(
        `该客户有 ${totalPending} 个未完成的预约，请先完成预约服务后再删除客户`
      );
    }

    // 使用事务确保所有删除操作原子性执行
    console.log(`[Delete Customer] Starting transaction`);
    await this.dataSource.transaction(async transactionalEntityManager => {
      // 1. 先删除关联的交易记录
      await transactionalEntityManager.delete(Transaction, { customerId: id, merchantId });
      console.log(`[Delete Customer] Deleted transactions`);

      // 2. 删除关联的预约记录（正式客户和H5客户的预约）
      await transactionalEntityManager.delete(Appointment, { customerId: id, merchantId });
      console.log(`[Delete Customer] Deleted appointments (customerId)`);
      
      // 删除H5客户的预约
      if (customer.openid) {
        const h5CustomerRepo = transactionalEntityManager.getRepository('H5Customer');
        const h5Customer = await h5CustomerRepo.findOne({
          where: { openid: customer.openid, merchantId }
        });
        if (h5Customer) {
          await transactionalEntityManager.delete(Appointment, { 
            h5CustomerId: (h5Customer as any).id, 
            merchantId 
          });
          console.log(`[Delete Customer] Deleted appointments (h5CustomerId)`);
          // 删除H5客户记录
          await h5CustomerRepo.delete({ id: (h5Customer as any).id });
          console.log(`[Delete Customer] Deleted H5 customer`);
        }
      }

      // 3. 删除关联的宠物记录
      await transactionalEntityManager.delete(Pet, { customerId: id });
      console.log(`[Delete Customer] Deleted pets`);

      // 4. 最后删除客户
      await transactionalEntityManager.delete(Customer, { id, merchantId });
      console.log(`[Delete Customer] Deleted customer successfully`);
    });
    console.log(`[Delete Customer] Transaction completed`);
  }

  async getHistory(merchantId: string, id: string): Promise<Transaction[]> {
    await this.findOne(merchantId, id);
    
    return this.transactionsRepository.find({
      where: { customerId: id, merchantId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async getInactive(merchantId: string): Promise<Customer[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return this.customersRepository.find({
      where: {
        merchantId,
        lastVisitAt: LessThan(thirtyDaysAgo),
      },
      order: { lastVisitAt: 'DESC' },
    });
  }
}
