import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Admin } from './admin.entity';
import { AdminLog } from './admin-log.entity';
import { Merchant } from '../merchant/merchant.entity';
import { Customer } from '../customer/customer.entity';
import { Appointment } from '../appointment/appointment.entity';
import { Transaction } from '../billing/transaction.entity';
import { Service } from '../appointment/service.entity';
import { Media, MediaType } from '../media/media.entity';
import { Withdrawal, WithdrawalStatus } from '../withdrawal/withdrawal.entity';
import { Package } from '../package/package.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private adminsRepository: Repository<Admin>,
    @InjectRepository(AdminLog)
    private adminLogsRepository: Repository<AdminLog>,
    @InjectRepository(Merchant)
    private merchantsRepository: Repository<Merchant>,
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>,
    @InjectRepository(Withdrawal)
    private withdrawalRepository: Repository<Withdrawal>,
    @InjectRepository(Package)
    private packageRepository: Repository<Package>,
    private jwtService: JwtService,
  ) {}

  async login(username: string, password: string) {
    const admin = await this.adminsRepository.findOne({
      where: { username },
    });

    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    await this.adminsRepository.update(admin.id, {
      lastLoginAt: new Date(),
    });

    const payload = { 
      adminId: admin.id, 
      username: admin.username, 
      role: admin.role 
    };

    return {
      access_token: this.jwtService.sign(payload),
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role,
      },
    };
  }

  async createAdmin(data: {
    username: string;
    password: string;
    name: string;
    role?: string;
  }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const admin = this.adminsRepository.create({
      ...data,
      password: hashedPassword,
      role: data.role as any || 'admin',
    });
    return this.adminsRepository.save(admin);
  }

  async initSuperAdmin() {
    const existing = await this.adminsRepository.findOne({
      where: { username: 'admin' },
    });
    
    if (!existing) {
      await this.createAdmin({
        username: 'admin',
        password: 'admin123456',
        name: '超级管理员',
        role: 'super_admin',
      });
      console.log('Super admin created: admin / admin123456');
    }

    // 初始化默认套餐
    const existingPackages = await this.packageRepository.count();
    if (existingPackages === 0) {
      const defaultPackages = [
        { name: '免费版', type: 'free', price: 0, description: '适合个人店主试用', features: ['基础客户管理', '最多50个客户', '基础预约功能'], status: 'active' },
        { name: '基础版', type: 'basic', price: 9900, description: '适合小型宠物店', features: ['无限客户管理', '套餐管理', '预约管理', '基础统计'], status: 'active' },
        { name: '专业版', type: 'pro', price: 29900, description: '适合成长型宠物店', features: ['基础版全部功能', '会员营销', '短信通知', '高级统计', '自定义服务'], status: 'active' },
        { name: '企业版', type: 'enterprise', price: 99900, description: '适合连锁宠物店', features: ['专业版全部功能', '多门店管理', '员工管理', 'API接口', '专属客服'], status: 'active' },
      ];
      for (const pkg of defaultPackages) {
        await this.packageRepository.save(this.packageRepository.create(pkg));
      }
      console.log('Default packages created');
    }
  }

  // ========== 商家管理 ==========

  async getMerchants(query: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) {
    const { page = 1, limit = 20, status, search } = query;
    
    const queryBuilder = this.merchantsRepository
      .createQueryBuilder('merchant')
      .orderBy('merchant.createdAt', 'DESC');

    if (status === 'active') {
      queryBuilder.andWhere('merchant.planType != :banned', { banned: 'banned' });
    } else if (status === 'banned') {
      queryBuilder.andWhere('merchant.planType = :banned', { banned: 'banned' });
    }

    if (search) {
      queryBuilder.andWhere(
        '(merchant.shopName LIKE :search OR merchant.phone LIKE :search)',
        { search: `%${search}%` }
      );
    }

    const total = await queryBuilder.getCount();
    const list = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    // 为每个商家添加业务统计
    const listWithStats = await Promise.all(
      list.map(async (m) => {
        const stats = await this.getMerchantQuickStats(m.id);
        return { ...m, stats };
      })
    );

    return {
      list: listWithStats,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getMerchantStats() {
    const total = await this.merchantsRepository.count();
    const active = await this.merchantsRepository.count({
      where: { planType: 'professional' },
    });
    const free = await this.merchantsRepository.count({
      where: { planType: 'free' },
    });
    const banned = await this.merchantsRepository.count({
      where: { planType: 'banned' },
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newThisWeek = await this.merchantsRepository
      .createQueryBuilder('merchant')
      .where('merchant.createdAt >= :date', { date: sevenDaysAgo })
      .getCount();

    return { total, active, free, banned, newThisWeek };
  }

  async approveMerchant(merchantId: string) {
    await this.merchantsRepository.update(merchantId, {
      planType: 'free',
    });
    return { success: true };
  }

  async banMerchant(merchantId: string, reason: string) {
    await this.merchantsRepository.update(merchantId, {
      planType: 'banned',
    });
    return { success: true, reason };
  }

  async unbanMerchant(merchantId: string) {
    await this.merchantsRepository.update(merchantId, {
      planType: 'free',
    });
    return { success: true };
  }

  async updateMerchantPlan(merchantId: string, planType: string, expiredAt?: string) {
    const updateData: any = { planType };
    if (expiredAt) {
      updateData.planExpiredAt = new Date(expiredAt);
    } else if (planType === 'free') {
      updateData.planExpiredAt = null;
    } else {
      const oneYearLater = new Date();
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
      updateData.planExpiredAt = oneYearLater;
    }
    
    await this.merchantsRepository.update(merchantId, updateData);
    return { success: true };
  }

  async getMerchantDetail(merchantId: string) {
    const merchant = await this.merchantsRepository.findOne({
      where: { id: merchantId },
    });

    if (!merchant) {
      throw new NotFoundException('商家不存在');
    }

    const stats = await this.getMerchantFullStats(merchantId);
    const recentTransactions = await this.getRecentTransactions(merchantId, 10);
    const recentAppointments = await this.getRecentAppointments(merchantId, 10);
    const revenueTrend = await this.getRevenueTrend(merchantId, 7);

    return {
      merchant,
      stats,
      recentTransactions,
      recentAppointments,
      revenueTrend,
    };
  }

  // ========== 平台统计 ==========

  async getPlatformStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 商家统计
    const merchantStats = await this.getMerchantStats();

    // 客户统计
    const totalCustomers = await this.customersRepository.count();
    const newCustomersWeek = await this.customersRepository
      .createQueryBuilder('customer')
      .where('customer.createdAt >= :date', { date: sevenDaysAgo })
      .getCount();

    // 交易统计
    const totalTransactions = await this.transactionsRepository.count();
    const todayTransactions = await this.transactionsRepository.count({
      where: {
        createdAt: Between(today, new Date()),
      },
    });

    const totalRevenue = await this.transactionsRepository
      .createQueryBuilder('transaction')
      .select('SUM(transaction.totalAmount)', 'sum')
      .getRawOne();

    const todayRevenue = await this.transactionsRepository
      .createQueryBuilder('transaction')
      .select('SUM(transaction.totalAmount)', 'sum')
      .where('transaction.createdAt >= :date', { date: today })
      .getRawOne();

    const weeklyRevenue = await this.transactionsRepository
      .createQueryBuilder('transaction')
      .select('SUM(transaction.totalAmount)', 'sum')
      .where('transaction.createdAt >= :date', { date: sevenDaysAgo })
      .getRawOne();

    // 预约统计
    const totalAppointments = await this.appointmentsRepository.count();
    const todayAppointments = await this.appointmentsRepository.count({
      where: {
        createdAt: Between(today, new Date()),
      },
    });

    return {
      merchants: merchantStats,
      customers: {
        total: totalCustomers,
        newThisWeek: newCustomersWeek,
      },
      transactions: {
        total: totalTransactions,
        today: todayTransactions,
        totalRevenue: parseFloat((totalRevenue as any)?.sum || '0'),
        todayRevenue: parseFloat((todayRevenue as any)?.sum || '0'),
        weeklyRevenue: parseFloat((weeklyRevenue as any)?.sum || '0'),
      },
      appointments: {
        total: totalAppointments,
        today: todayAppointments,
      },
    };
  }

  async getPlatformTrend(days: number = 7) {
    const result = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const transactions = await this.transactionsRepository.count({
        where: { createdAt: Between(date, nextDate) },
      });

      const revenue = await this.transactionsRepository
        .createQueryBuilder('transaction')
        .select('SUM(transaction.totalAmount)', 'sum')
        .where('transaction.createdAt BETWEEN :start AND :end', { start: date, end: nextDate })
        .getRawOne();

      const newMerchants = await this.merchantsRepository.count({
        where: { createdAt: Between(date, nextDate) },
      });

      const newCustomers = await this.customersRepository.count({
        where: { createdAt: Between(date, nextDate) },
      });

      result.push({
        date: date.toISOString().split('T')[0],
        transactions,
        revenue: parseFloat((revenue as any)?.sum || '0'),
        newMerchants,
        newCustomers,
      });
    }

    return result;
  }

  async getRevenueStats(startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);
    start.setHours(0, 0, 0, 0);

    const dailyStats: any[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayStart = new Date(d);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      const revenue = await this.transactionsRepository
        .createQueryBuilder('transaction')
        .select('SUM(transaction.totalAmount)', 'sum')
        .where('transaction.createdAt BETWEEN :start AND :end', { start: dayStart, end: dayEnd })
        .getRawOne();

      const count = await this.transactionsRepository.count({
        where: { createdAt: Between(dayStart, dayEnd) },
      });

      dailyStats.push({
        date: dayStart.toISOString().split('T')[0],
        revenue: parseFloat((revenue as any)?.sum || '0'),
        count,
      });
    }

    const totalRevenue = dailyStats.reduce((sum, d) => sum + d.revenue, 0);
    const totalTransactions = dailyStats.reduce((sum, d) => sum + d.count, 0);
    const avgRevenue = dailyStats.length > 0 ? totalRevenue / dailyStats.length : 0;

    return {
      daily: dailyStats,
      summary: {
        totalRevenue,
        totalTransactions,
        avgRevenue: Math.round(avgRevenue),
        days: dailyStats.length,
      },
    };
  }

  async getMerchantRanking(type: string = 'revenue', limit: number = 20) {
    const merchants = await this.merchantsRepository.find();
    
    const filtered = merchants.filter(m => m.planType !== 'banned');

    const allTransactions = await this.transactionsRepository.find();
    const allCustomers = await this.customersRepository.find();
    const allAppointments = await this.appointmentsRepository.find();

    const revenueByMerchant = new Map<string, number>();
    const customerCountByMerchant = new Map<string, number>();
    const appointmentCountByMerchant = new Map<string, number>();

    for (const t of allTransactions) {
      const current = revenueByMerchant.get(t.merchantId) || 0;
      const amount = typeof t.totalAmount === 'string' ? parseFloat(t.totalAmount) : (t.totalAmount || 0);
      revenueByMerchant.set(t.merchantId, current + amount);
    }

    for (const c of allCustomers) {
      const current = customerCountByMerchant.get(c.merchantId) || 0;
      customerCountByMerchant.set(c.merchantId, current + 1);
    }

    for (const a of allAppointments) {
      const current = appointmentCountByMerchant.get(a.merchantId) || 0;
      appointmentCountByMerchant.set(a.merchantId, current + 1);
    }

    const results = filtered.map(m => ({
      id: m.id,
      shopName: m.shopName,
      phone: m.phone,
      planType: m.planType,
      revenue: revenueByMerchant.get(m.id) || 0,
      customers: customerCountByMerchant.get(m.id) || 0,
      appointments: appointmentCountByMerchant.get(m.id) || 0,
    }));

    if (type === 'revenue') {
      results.sort((a, b) => b.revenue - a.revenue);
    } else if (type === 'customers') {
      results.sort((a, b) => b.customers - a.customers);
    } else if (type === 'appointments') {
      results.sort((a, b) => b.appointments - a.appointments);
    }

    return results.slice(0, limit);
  }

  // ========== 私有方法 ==========

  private async getMerchantQuickStats(merchantId: string) {
    const customers = await this.customersRepository.count({
      where: { merchantId },
    });
    const appointments = await this.appointmentsRepository.count({
      where: { merchantId },
    });
    const revenue = await this.transactionsRepository
      .createQueryBuilder('transaction')
      .select('SUM(transaction.totalAmount)', 'sum')
      .where('transaction.merchantId = :id', { id: merchantId })
      .getRawOne();

    return {
      customers,
      appointments,
      revenue: parseFloat((revenue as any)?.sum || '0'),
    };
  }

  private async getMerchantFullStats(merchantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 基础统计
    const totalCustomers = await this.customersRepository.count({
      where: { merchantId },
    });
    const totalAppointments = await this.appointmentsRepository.count({
      where: { merchantId },
    });
    const totalTransactions = await this.transactionsRepository.count({
      where: { merchantId },
    });
    const totalServices = await this.servicesRepository.count({
      where: { merchantId },
    });

    // 收入统计
    const totalRevenue = await this.transactionsRepository
      .createQueryBuilder('transaction')
      .select('SUM(transaction.totalAmount)', 'sum')
      .where('transaction.merchantId = :id', { id: merchantId })
      .getRawOne();

    const monthlyRevenue = await this.transactionsRepository
      .createQueryBuilder('transaction')
      .select('SUM(transaction.totalAmount)', 'sum')
      .where('transaction.merchantId = :id', { id: merchantId })
      .andWhere('transaction.createdAt >= :date', { date: thirtyDaysAgo })
      .getRawOne();

    const todayRevenue = await this.transactionsRepository
      .createQueryBuilder('transaction')
      .select('SUM(transaction.totalAmount)', 'sum')
      .where('transaction.merchantId = :id', { id: merchantId })
      .andWhere('transaction.createdAt >= :date', { date: today })
      .getRawOne();

    // 今日预约
    const todayAppointments = await this.appointmentsRepository.count({
      where: {
        merchantId,
        appointmentTime: Between(today, new Date()),
      },
    });

    // 待服务预约
    const pendingAppointments = await this.appointmentsRepository.count({
      where: { merchantId, status: 'pending' },
    });

    // 客单价
    const avgPrice = totalTransactions > 0 
      ? parseFloat((totalRevenue as any)?.sum || '0') / totalTransactions 
      : 0;

    // 活跃客户（30天内有交易）
    const activeCustomers = await this.transactionsRepository
      .createQueryBuilder('transaction')
      .select('COUNT(DISTINCT transaction.customerId)', 'count')
      .where('transaction.merchantId = :id', { id: merchantId })
      .andWhere('transaction.createdAt >= :date', { date: thirtyDaysAgo })
      .getRawOne();

    return {
      customers: {
        total: totalCustomers,
        active: parseInt((activeCustomers as any)?.count || '0'),
      },
      appointments: {
        total: totalAppointments,
        today: todayAppointments,
        pending: pendingAppointments,
      },
      transactions: {
        total: totalTransactions,
      },
      services: {
        total: totalServices,
      },
      revenue: {
        total: parseFloat((totalRevenue as any)?.sum || '0'),
        monthly: parseFloat((monthlyRevenue as any)?.sum || '0'),
        today: parseFloat((todayRevenue as any)?.sum || '0'),
        avgPrice,
      },
    };
  }

  private async getRecentTransactions(merchantId: string, limit: number) {
    return this.transactionsRepository.find({
      where: { merchantId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  private async getRecentAppointments(merchantId: string, limit: number) {
    return this.appointmentsRepository.find({
      where: { merchantId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  private async getRevenueTrend(merchantId: string, days: number) {
    const result = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const revenue = await this.transactionsRepository
        .createQueryBuilder('transaction')
        .select('SUM(transaction.totalAmount)', 'sum')
        .where('transaction.merchantId = :id', { id: merchantId })
        .andWhere('transaction.createdAt BETWEEN :start AND :end', { 
          start: date, 
          end: nextDate 
        })
        .getRawOne();

      result.push({
        date: date.toISOString().split('T')[0],
        revenue: parseFloat((revenue as any)?.sum || '0'),
      });
    }

    return result;
  }

  // ========== 操作日志 ==========

  async createLog(data: {
    adminId: string;
    action: string;
    targetType?: string;
    targetId?: string;
    detail?: Record<string, any>;
    ip?: string;
  }) {
    const log = this.adminLogsRepository.create(data);
    return this.adminLogsRepository.save(log);
  }

  async getLogs(query: {
    page?: number;
    limit?: number;
    adminId?: string;
    action?: string;
    targetType?: string;
  }) {
    const { page = 1, limit = 20, adminId, action, targetType } = query;

    const queryBuilder = this.adminLogsRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.admin', 'admin')
      .orderBy('log.createdAt', 'DESC');

    if (adminId) {
      queryBuilder.andWhere('log.adminId = :adminId', { adminId });
    }
    if (action) {
      queryBuilder.andWhere('log.action = :action', { action });
    }
    if (targetType) {
      queryBuilder.andWhere('log.targetType = :targetType', { targetType });
    }

    const total = await queryBuilder.getCount();
    const list = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      list: list.map(l => ({
        ...l,
        adminName: l.admin?.name || l.admin?.username,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ========== 素材库管理 ==========

  async getMediaList(query: {
    page?: number;
    limit?: number;
    merchantId?: string;
    type?: string;
    category?: string;
  }) {
    const { page = 1, limit = 20, merchantId, type, category } = query;

    const queryBuilder = this.mediaRepository
      .createQueryBuilder('media')
      .leftJoinAndSelect('media.merchant', 'merchant')
      .orderBy('media.createdAt', 'DESC');

    if (merchantId) {
      queryBuilder.andWhere('media.merchantId = :merchantId', { merchantId });
    }
    if (type) {
      queryBuilder.andWhere('media.type = :type', { type });
    }
    if (category) {
      queryBuilder.andWhere('media.category = :category', { category });
    }

    const total = await queryBuilder.getCount();
    const list = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const totalSize = await this.mediaRepository
      .createQueryBuilder('media')
      .select('SUM(media.size)', 'sum')
      .getRawOne();

    return {
      list: list.map(m => ({
        ...m,
        shopName: m.merchant?.shopName,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalSize: parseFloat((totalSize as any)?.sum || '0'),
    };
  }

  async deleteMedia(mediaId: string) {
    await this.mediaRepository.delete(mediaId);
    return { success: true };
  }

  async getMediaStats() {
    const total = await this.mediaRepository.count();
    const images = await this.mediaRepository.count({
      where: { type: MediaType.IMAGE },
    });
    const videos = await this.mediaRepository.count({
      where: { type: MediaType.VIDEO },
    });
    const documents = await this.mediaRepository.count({
      where: { type: MediaType.DOCUMENT },
    });

    const totalSize = await this.mediaRepository
      .createQueryBuilder('media')
      .select('SUM(media.size)', 'sum')
      .getRawOne();

    const byMerchant = await this.mediaRepository
      .createQueryBuilder('media')
      .select('media.merchantId', 'merchantId')
      .addSelect('COUNT(media.id)', 'count')
      .addSelect('SUM(media.size)', 'size')
      .groupBy('media.merchantId')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      total,
      images,
      videos,
      documents,
      totalSize: parseFloat((totalSize as any)?.sum || '0'),
      byMerchant,
    };
  }

  // ========== 提现管理 ==========

  async getWithdrawalList(query: {
    page?: number;
    limit?: number;
    status?: string;
    merchantId?: string;
  }) {
    const { page = 1, limit = 20, status, merchantId } = query;

    const queryBuilder = this.withdrawalRepository
      .createQueryBuilder('withdrawal')
      .leftJoinAndSelect('withdrawal.merchant', 'merchant')
      .orderBy('withdrawal.createdAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('withdrawal.status = :status', { status });
    }
    if (merchantId) {
      queryBuilder.andWhere('withdrawal.merchantId = :merchantId', { merchantId });
    }

    const total = await queryBuilder.getCount();
    const list = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const pendingAmount = await this.withdrawalRepository
      .createQueryBuilder('withdrawal')
      .select('SUM(withdrawal.amount)', 'sum')
      .where('withdrawal.status = :status', { status: WithdrawalStatus.PENDING })
      .getRawOne();

    return {
      list: list.map(w => ({
        ...w,
        shopName: w.merchant?.shopName,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      pendingAmount: parseFloat((pendingAmount as any)?.sum || '0'),
    };
  }

  async processWithdrawal(
    withdrawalId: string,
    status: WithdrawalStatus,
    transactionNo: string,
    remark: string,
    adminId: string,
  ) {
    const withdrawal = await this.withdrawalRepository.findOne({
      where: { id: withdrawalId },
    });

    if (!withdrawal) {
      throw new NotFoundException('提现记录不存在');
    }

    await this.withdrawalRepository.update(withdrawalId, {
      status,
      transactionNo,
      remark,
      processedAt: new Date(),
      processedBy: adminId,
    });

    return { success: true };
  }

  async getWithdrawalStats() {
    const total = await this.withdrawalRepository.count();
    const pending = await this.withdrawalRepository.count({
      where: { status: WithdrawalStatus.PENDING },
    });
    const completed = await this.withdrawalRepository.count({
      where: { status: WithdrawalStatus.COMPLETED },
    });
    const failed = await this.withdrawalRepository.count({
      where: { status: WithdrawalStatus.FAILED },
    });

    const pendingAmount = await this.withdrawalRepository
      .createQueryBuilder('withdrawal')
      .select('SUM(withdrawal.amount)', 'sum')
      .where('withdrawal.status = :status', { status: WithdrawalStatus.PENDING })
      .getRawOne();

    const completedAmount = await this.withdrawalRepository
      .createQueryBuilder('withdrawal')
      .select('SUM(withdrawal.amount)', 'sum')
      .where('withdrawal.status = :status', { status: WithdrawalStatus.COMPLETED })
      .getRawOne();

    return {
      total,
      pending,
      completed,
      failed,
      pendingAmount: parseFloat((pendingAmount as any)?.sum || '0'),
      completedAmount: parseFloat((completedAmount as any)?.sum || '0'),
    };
  }

  // Package Management
  async getPackages() {
    return this.packageRepository.find({ order: { price: 'ASC' } });
  }

  async getPackage(id: string) {
    return this.packageRepository.findOne({ where: { id } });
  }

  async createPackage(data: {
    name: string;
    type: string;
    price: number;
    description?: string;
    features?: string[];
  }) {
    const pkg = this.packageRepository.create(data);
    return this.packageRepository.save(pkg);
  }

  async updatePackage(id: string, data: Partial<{
    name: string;
    type: string;
    price: number;
    description: string;
    features: string[];
    status: string;
  }>) {
    await this.packageRepository.update(id, data);
    return this.getPackage(id);
  }

  async deletePackage(id: string) {
    await this.packageRepository.delete(id);
    return { success: true };
  }

  async updatePackageStatus(id: string, status: string) {
    await this.packageRepository.update(id, { status });
    return this.getPackage(id);
  }
}
