import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Transaction } from '../billing/transaction.entity';
import { Customer } from '../customer/customer.entity';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
  ) {}

  async getDailyReport(merchantId: string, date?: string): Promise<any> {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const transactions = await this.transactionsRepository.find({
      where: {
        merchantId,
        createdAt: Between(startOfDay, endOfDay),
      },
    });

    const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.totalAmount), 0);
    const orderCount = transactions.length;
    const uniqueCustomers = new Set(transactions.map(t => t.customerId)).size;

    const paymentBreakdown: Record<string, { count: number; amount: number }> = {};
    transactions.forEach(t => {
      if (!paymentBreakdown[t.paymentMethod]) {
        paymentBreakdown[t.paymentMethod] = { count: 0, amount: 0 };
      }
      paymentBreakdown[t.paymentMethod].count++;
      paymentBreakdown[t.paymentMethod].amount += Number(t.totalAmount);
    });

    const serviceStats: Record<string, { count: number; revenue: number }> = {};
    transactions.forEach(t => {
      t.items.forEach(item => {
        if (!serviceStats[item.name]) {
          serviceStats[item.name] = { count: 0, revenue: 0 };
        }
        serviceStats[item.name].count++;
        serviceStats[item.name].revenue += Number(item.price) * (item.quantity || 1);
      });
    });

    return {
      date: targetDate.toISOString().split('T')[0],
      totalRevenue,
      orderCount,
      avgPrice: orderCount > 0 ? totalRevenue / orderCount : 0,
      uniqueCustomers,
      paymentBreakdown,
      serviceStats: Object.entries(serviceStats)
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5),
    };
  }

  async getMonthlyReport(merchantId: string, year: number, month: number): Promise<any> {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const transactions = await this.transactionsRepository.find({
      where: {
        merchantId,
        createdAt: Between(startOfMonth, endOfMonth),
      },
    });

    const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.totalAmount), 0);
    const orderCount = transactions.length;

    const dailyStats: Record<string, { revenue: number; count: number }> = {};
    transactions.forEach(t => {
      const day = t.createdAt.toISOString().split('T')[0];
      if (!dailyStats[day]) {
        dailyStats[day] = { revenue: 0, count: 0 };
      }
      dailyStats[day].revenue += Number(t.totalAmount);
      dailyStats[day].count++;
    });

    return {
      year,
      month,
      totalRevenue,
      orderCount,
      avgPrice: orderCount > 0 ? totalRevenue / orderCount : 0,
      dailyStats: Object.entries(dailyStats)
        .map(([date, stats]) => ({ date, ...stats }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  }

  async getCustomerReport(merchantId: string): Promise<any> {
    const customers = await this.customersRepository.find({
      where: { merchantId },
      order: { totalSpent: 'DESC' },
      take: 50,
    });

    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => {
      if (!c.lastVisitAt) return false;
      const daysSinceLastVisit = (Date.now() - new Date(c.lastVisitAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceLastVisit <= 30;
    }).length;

    const totalSpent = customers.reduce((sum, c) => sum + Number(c.totalSpent), 0);

    return {
      totalCustomers,
      activeCustomers,
      inactiveCustomers: totalCustomers - activeCustomers,
      totalSpent,
      avgSpent: totalCustomers > 0 ? totalSpent / totalCustomers : 0,
      topCustomers: customers.slice(0, 10).map(c => ({
        id: c.id,
        petName: c.petName,
        totalSpent: c.totalSpent,
        visitCount: c.visitCount,
        lastVisitAt: c.lastVisitAt,
      })),
    };
  }

  async getServiceReport(merchantId: string): Promise<any> {
    const transactions = await this.transactionsRepository.find({
      where: { merchantId },
    });

    const serviceStats: Record<string, { count: number; revenue: number }> = {};
    transactions.forEach(t => {
      t.items.forEach(item => {
        if (!serviceStats[item.name]) {
          serviceStats[item.name] = { count: 0, revenue: 0 };
        }
        serviceStats[item.name].count++;
        serviceStats[item.name].revenue += Number(item.price) * (item.quantity || 1);
      });
    });

    return Object.entries(serviceStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.revenue - a.revenue);
  }
}
