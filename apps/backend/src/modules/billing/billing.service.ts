import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Transaction, TransactionItem } from './transaction.entity';
import { Customer } from '../customer/customer.entity';
import { Appointment } from '../appointment/appointment.entity';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
  ) {}

  async checkout(
    merchantId: string,
    data: {
      customerId: string;
      appointmentId?: string;
      items: TransactionItem[];
      totalAmount: number;
      paymentMethod: 'wechat' | 'alipay' | 'cash' | 'member';
    },
  ): Promise<Transaction> {
    const customer = await this.customersRepository.findOne({
      where: { id: data.customerId, merchantId },
    });

    if (!customer) {
      throw new NotFoundException('客户不存在');
    }

    const transaction = this.transactionsRepository.create({
      merchantId,
      customerId: data.customerId,
      appointmentId: data.appointmentId,
      items: data.items,
      totalAmount: data.totalAmount,
      paymentMethod: data.paymentMethod,
    });

    const savedTransaction = await this.transactionsRepository.save(transaction);

    customer.totalSpent = Number(customer.totalSpent) + data.totalAmount;
    customer.visitCount += 1;
    customer.lastVisitAt = new Date();
    await this.customersRepository.save(customer);

    if (data.appointmentId) {
      await this.appointmentsRepository.update(data.appointmentId, {
        status: 'completed',
      });
    }

    return savedTransaction;
  }

  async findToday(merchantId: string): Promise<Transaction[]> {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    return this.transactionsRepository.find({
      where: {
        merchantId,
        createdAt: Between(startOfDay, endOfDay),
      },
      relations: ['customer'],
      order: { createdAt: 'DESC' },
    });
  }

  async getDailySummary(merchantId: string): Promise<any> {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const transactions = await this.transactionsRepository.find({
      where: {
        merchantId,
        createdAt: Between(startOfDay, endOfDay),
      },
    });

    const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.totalAmount), 0);
    const orderCount = transactions.length;
    const avgPrice = orderCount > 0 ? totalRevenue / orderCount : 0;

    const paymentBreakdown: Record<string, number> = {};
    transactions.forEach((t) => {
      paymentBreakdown[t.paymentMethod] =
        (paymentBreakdown[t.paymentMethod] || 0) + Number(t.totalAmount);
    });

    const customerIds = [...new Set(transactions.map((t) => t.customerId))];

    return {
      totalRevenue,
      orderCount,
      avgPrice,
      paymentBreakdown,
      uniqueCustomers: customerIds.length,
    };
  }

  async closeDay(merchantId: string, cashAmount: number): Promise<any> {
    const summary = await this.getDailySummary(merchantId);

    return {
      ...summary,
      cashExpected: summary.paymentBreakdown['cash'] || 0,
      cashActual: cashAmount,
      cashDiff: cashAmount - (summary.paymentBreakdown['cash'] || 0),
      closedAt: new Date(),
    };
  }
}
