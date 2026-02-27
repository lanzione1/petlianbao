import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Staff } from './staff.entity';
import { OperationLog } from './operation-log.entity';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(Staff)
    private staffsRepository: Repository<Staff>,
    @InjectRepository(OperationLog)
    private logsRepository: Repository<OperationLog>,
  ) {}

  async findAll(merchantId: string): Promise<Staff[]> {
    return this.staffsRepository.find({
      where: { merchantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Staff> {
    const staff = await this.staffsRepository.findOne({ where: { id } });
    if (!staff) {
      throw new NotFoundException('店员不存在');
    }
    return staff;
  }

  async findByOpenid(openid: string): Promise<Staff | null> {
    return this.staffsRepository.findOne({ where: { openid } });
  }

  async create(merchantId: string, data: {
    openid: string;
    nickname?: string;
    avatar?: string;
    role?: 'admin' | 'staff';
  }): Promise<Staff> {
    const existing = await this.staffsRepository.findOne({
      where: { openid: data.openid },
    });
    
    if (existing) {
      if (existing.merchantId === merchantId) {
        throw new ForbiddenException('该用户已是店员');
      }
      throw new ForbiddenException('该用户已在其他店铺');
    }

    const staff = this.staffsRepository.create({
      merchantId,
      openid: data.openid,
      nickname: data.nickname || '店员',
      avatar: data.avatar,
      role: data.role || 'staff',
      status: 'active',
    });

    const result = await this.staffsRepository.save(staff);
    
    await this.log(merchantId, result.id, result.nickname, 'add_staff', 'staff', result.id, {
      nickname: result.nickname,
      role: result.role,
    });

    return result;
  }

  async remove(id: string, merchantId: string): Promise<void> {
    const staff = await this.findOne(id);
    if (staff.merchantId !== merchantId) {
      throw new ForbiddenException('无权操作');
    }
    if (staff.role === 'admin') {
      throw new ForbiddenException('不能删除管理员');
    }
    
    await this.log(merchantId, staff.id, staff.nickname, 'remove_staff', 'staff', staff.id, {
      nickname: staff.nickname,
    });

    await this.staffsRepository.delete(id);
  }

  async updateStatus(id: string, status: 'active' | 'disabled', merchantId: string): Promise<Staff> {
    const staff = await this.findOne(id);
    if (staff.merchantId !== merchantId) {
      throw new ForbiddenException('无权操作');
    }
    
    await this.staffsRepository.update(id, { status });
    
    await this.log(merchantId, staff.id, staff.nickname, 
      status === 'active' ? 'enable_staff' : 'disable_staff', 
      'staff', id, { nickname: staff.nickname, status }
    );

    return this.findOne(id);
  }

  async log(
    merchantId: string,
    staffId: string,
    staffName: string,
    action: string,
    targetType: string,
    targetId: string,
    details: Record<string, any>,
  ): Promise<void> {
    const logEntry = this.logsRepository.create({
      merchantId,
      staffId,
      staffName,
      action,
      targetType,
      targetId,
      details,
    });
    await this.logsRepository.save(logEntry);
  }

  async findLogs(merchantId: string, options?: {
    staffId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ data: OperationLog[]; total: number }> {
    const query = this.logsRepository.createQueryBuilder('log')
      .where('log.merchantId = :merchantId', { merchantId });

    if (options?.staffId) {
      query.andWhere('log.staffId = :staffId', { staffId: options.staffId });
    }
    if (options?.action) {
      query.andWhere('log.action = :action', { action: options.action });
    }
    if (options?.startDate) {
      query.andWhere('log.createdAt >= :startDate', { startDate: options.startDate });
    }
    if (options?.endDate) {
      query.andWhere('log.createdAt <= :endDate', { endDate: options.endDate });
    }

    const total = await query.getCount();
    
    const data = await query
      .orderBy('log.createdAt', 'DESC')
      .skip(options?.offset || 0)
      .take(options?.limit || 50)
      .getMany();

    return { data, total };
  }
}
