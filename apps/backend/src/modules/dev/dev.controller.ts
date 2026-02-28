import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DataSource } from 'typeorm';
import { Customer } from '../customer/customer.entity';
import { Service } from '../appointment/service.entity';
import { Appointment } from '../appointment/appointment.entity';
import { Pet } from '../pet/pet.entity';
import { Transaction } from '../billing/transaction.entity';
import { H5Customer } from '../h5-customer/h5-customer.entity';
import { H5Pet } from '../h5-customer/h5-pet.entity';
import { AppointmentHistory } from '../appointment/appointment-history.entity';

@Controller('dev')
export class DevController {
  constructor(private dataSource: DataSource) {}

  @Post('seed')
  @UseGuards(AuthGuard('jwt'))
  async seedData(@Request() req) {
    const merchantId = req.user.merchantId;

    const customerRepo = this.dataSource.getRepository(Customer);
    const petRepo = this.dataSource.getRepository(Pet);
    const serviceRepo = this.dataSource.getRepository(Service);
    const appointmentRepo = this.dataSource.getRepository(Appointment);

    // 创建测试客户（以人为主）
    const customers = [
      {
        petName: '张三',
        petBreed: '',
        phone: '13800000001',
        merchantId,
        totalSpent: 2580,
        visitCount: 12,
        lastVisitAt: new Date(),
      },
      {
        petName: '李四',
        petBreed: '',
        phone: '13800000002',
        merchantId,
        totalSpent: 1850,
        visitCount: 8,
        lastVisitAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        petName: '王五',
        petBreed: '',
        phone: '13800000003',
        merchantId,
        totalSpent: 3200,
        visitCount: 15,
        lastVisitAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        petName: '赵六',
        petBreed: '',
        phone: '13800000004',
        merchantId,
        totalSpent: 980,
        visitCount: 5,
        lastVisitAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      },
      {
        petName: '钱七',
        petBreed: '',
        phone: '13800000005',
        merchantId,
        totalSpent: 1560,
        visitCount: 7,
        lastVisitAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    ];

    const createdCustomers = await customerRepo.save(customers.map((c) => customerRepo.create(c)));

    // 为每个客户创建宠物
    const petsData = [
      // 张三的宠物
      {
        customerId: createdCustomers[0].id,
        name: '旺财',
        species: 'dog' as const,
        breed: '金毛',
        weight: 25,
        birthday: new Date('2020-03-15'),
        nextVaccineDate: new Date('2026-05-01'),
        nextDewormDate: new Date('2026-04-01'),
      },
      {
        customerId: createdCustomers[0].id,
        name: '豆豆',
        species: 'cat' as const,
        breed: '英短',
        weight: 4.5,
        birthday: new Date('2021-06-20'),
        nextVaccineDate: new Date('2026-08-15'),
        nextDewormDate: new Date('2026-06-01'),
      },
      // 李四的宠物
      {
        customerId: createdCustomers[1].id,
        name: '小白',
        species: 'dog' as const,
        breed: '萨摩耶',
        weight: 22,
        birthday: new Date('2019-11-10'),
        nextVaccineDate: new Date('2026-03-20'),
        nextDewormDate: new Date('2026-03-01'),
      },
      // 王五的宠物
      {
        customerId: createdCustomers[2].id,
        name: '布丁',
        species: 'dog' as const,
        breed: '柯基',
        weight: 12,
        birthday: new Date('2022-02-14'),
        nextVaccineDate: new Date('2026-04-10'),
        nextDewormDate: new Date('2026-03-15'),
      },
      {
        customerId: createdCustomers[2].id,
        name: '米粒',
        species: 'cat' as const,
        breed: '布偶',
        weight: 5,
        birthday: new Date('2023-01-01'),
        nextVaccineDate: new Date('2026-07-01'),
        nextDewormDate: new Date('2026-05-01'),
      },
      // 赵六的宠物
      {
        customerId: createdCustomers[3].id,
        name: '哈利',
        species: 'dog' as const,
        breed: '哈士奇',
        weight: 20,
        birthday: new Date('2021-08-25'),
        nextVaccineDate: new Date('2026-02-28'),
        nextDewormDate: new Date('2026-02-20'),
      },
      // 钱七的宠物
      {
        customerId: createdCustomers[4].id,
        name: '皮皮',
        species: 'dog' as const,
        breed: '泰迪',
        weight: 8,
        birthday: new Date('2020-12-05'),
        nextVaccineDate: new Date('2026-06-01'),
        nextDewormDate: new Date('2026-04-15'),
      },
    ];

    await petRepo.save(petsData.map((p) => petRepo.create(p)));

    // 创建测试服务
    const services = [
      { name: '洗澡', price: 80, duration: 60, merchantId },
      { name: '美容', price: 150, duration: 120, merchantId },
      { name: '疫苗', price: 100, duration: 30, merchantId },
      { name: '驱虫', price: 50, duration: 20, merchantId },
      { name: '体检', price: 200, duration: 60, merchantId },
    ];

    const createdServices = await serviceRepo.save(services.map((s) => serviceRepo.create(s)));

    // 创建测试预约 - 增加今日预约数量
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const appointments = [
      // 今日待服务预约
      {
        customerId: createdCustomers[0].id,
        serviceId: createdServices[0].id,
        merchantId,
        appointmentTime: new Date(today.getTime() + 10 * 60 * 60 * 1000), // 10:00
        status: 'pending' as const,
        notes: '旺财洗澡，注意水温',
      },
      {
        customerId: createdCustomers[1].id,
        serviceId: createdServices[1].id,
        merchantId,
        appointmentTime: new Date(today.getTime() + 11 * 60 * 60 * 1000 + 30 * 60 * 1000), // 11:30
        status: 'pending' as const,
        notes: '小白美容，毛发打结严重',
      },
      {
        customerId: createdCustomers[2].id,
        serviceId: createdServices[4].id,
        merchantId,
        appointmentTime: new Date(today.getTime() + 14 * 60 * 60 * 1000), // 14:00
        status: 'pending' as const,
        notes: '布丁年度体检',
      },
      {
        customerId: createdCustomers[3].id,
        serviceId: createdServices[0].id,
        merchantId,
        appointmentTime: new Date(today.getTime() + 15 * 60 * 60 * 1000 + 30 * 60 * 1000), // 15:30
        status: 'pending' as const,
        notes: '哈利洗澡，性格较暴躁',
      },
      // 今日已确认预约（改为待服务）
      {
        customerId: createdCustomers[4].id,
        serviceId: createdServices[1].id,
        merchantId,
        appointmentTime: new Date(today.getTime() + 16 * 60 * 60 * 1000), // 16:00
        status: 'pending' as const,
        notes: '皮皮美容',
      },
      // 今日已完成预约
      {
        customerId: createdCustomers[0].id,
        serviceId: createdServices[2].id,
        merchantId,
        appointmentTime: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 09:00
        status: 'completed' as const,
        notes: '旺财疫苗接种完成',
      },
      {
        customerId: createdCustomers[2].id,
        serviceId: createdServices[3].id,
        merchantId,
        appointmentTime: new Date(today.getTime() + 9 * 60 * 60 * 1000 + 30 * 60 * 1000), // 09:30
        status: 'paid' as const,
        notes: '米粒体内外驱虫完成',
      },
      // 明日预约
      {
        customerId: createdCustomers[1].id,
        serviceId: createdServices[0].id,
        merchantId,
        appointmentTime: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000), // 明天10:00
        status: 'pending' as const,
        notes: '明天洗澡预约',
      },
    ];

    const createdAppointments = await appointmentRepo.save(
      appointments.map((a) => appointmentRepo.create(a)),
    );

    // 创建交易记录（用于已完成预约）
    const transactionRepo = this.dataSource.getRepository(Transaction);
    const transactions = [
      {
        merchantId,
        customerId: createdCustomers[0].id,
        appointmentId: createdAppointments[5].id,
        items: [{ name: '疫苗', price: 100, quantity: 1 }],
        totalAmount: 100,
        paymentMethod: 'wechat' as const,
        status: 'completed' as const,
      },
      {
        merchantId,
        customerId: createdCustomers[2].id,
        appointmentId: createdAppointments[6].id,
        items: [{ name: '驱虫', price: 50, quantity: 1 }],
        totalAmount: 50,
        paymentMethod: 'cash' as const,
        status: 'completed' as const,
      },
    ];
    await transactionRepo.save(transactions.map((t) => transactionRepo.create(t)));

    return {
      message: '测试数据创建成功',
      customers: createdCustomers.length,
      services: createdServices.length,
      appointments: appointments.length,
      pets: petsData.length,
      transactions: transactions.length,
    };
  }

  @Post('clear')
  @UseGuards(AuthGuard('jwt'))
  async clearData(@Request() req) {
    const merchantId = req.user.merchantId;

    await this.dataSource.getRepository(Transaction).delete({ merchantId });
    await this.dataSource.getRepository(Appointment).delete({ merchantId });
    await this.dataSource.getRepository(Pet).delete({ merchantId });
    await this.dataSource.getRepository(Service).delete({ merchantId });
    await this.dataSource.getRepository(Customer).delete({ merchantId });

    return { message: '测试数据已清除' };
  }

  @Post('migrate-pets')
  @UseGuards(AuthGuard('jwt'))
  async migratePets(@Request() req) {
    const merchantId = req.user.merchantId;
    const customerRepo = this.dataSource.getRepository(Customer);
    const petRepo = this.dataSource.getRepository(Pet);

    const customers = await customerRepo.find({ where: { merchantId } });

    let created = 0;
    for (const customer of customers) {
      if (customer.petName) {
        const existingPets = await petRepo.count({ where: { customerId: customer.id } });
        if (existingPets === 0) {
          const species = this.guessSpecies(customer.petBreed);
          await petRepo.save({
            customerId: customer.id,
            name: customer.petName,
            species,
            breed: customer.petBreed || '未知',
          });
          created++;
        }
      }
    }

    return { message: `已为 ${created} 个客户创建宠物档案` };
  }

  private guessSpecies(breed: string | null): 'dog' | 'cat' | 'other' {
    if (!breed) return 'other';
    const lower = breed.toLowerCase();
    if (
      lower.includes('狗') ||
      lower.includes('犬') ||
      ['金毛', '柯基', '泰迪', '萨摩耶', '哈士奇', '阿拉斯加'].some((b) => lower.includes(b))
    ) {
      return 'dog';
    }
    if (lower.includes('猫') || lower.includes('喵')) {
      return 'cat';
    }
    return 'other';
  }

  @Post('h5/seed')
  async seedH5Data(@Request() req) {
    const merchantId = req.user.merchantId;

    const h5CustomerRepo = this.dataSource.getRepository(H5Customer);
    const h5PetRepo = this.dataSource.getRepository(H5Pet);
    const serviceRepo = this.dataSource.getRepository(Service);
    const appointmentRepo = this.dataSource.getRepository(Appointment);
    const historyRepo = this.dataSource.getRepository(AppointmentHistory);

    // 创建测试H5客户
    const h5Customers = [
      {
        merchantId,
        openid: 'test_openid_001',
        nickname: '测试用户1',
        phone: '13900000001',
        avatar: '',
      },
      {
        merchantId,
        openid: 'test_openid_002',
        nickname: '测试用户2',
        phone: '13900000002',
        avatar: '',
      },
      {
        merchantId,
        openid: 'test_openid_003',
        nickname: '测试用户3',
        phone: '13900000003',
        avatar: '',
      },
    ];

    const createdH5Customers = await h5CustomerRepo.save(
      h5Customers.map((c) => h5CustomerRepo.create(c)),
    );

    // 为每个客户创建宠物
    const h5PetsData = [
      {
        customerId: createdH5Customers[0].id,
        name: '小黄',
        species: 'dog' as const,
        breed: '金毛',
        gender: 'male' as const,
        weight: 25,
      },
      {
        customerId: createdH5Customers[0].id,
        name: '小花',
        species: 'cat' as const,
        breed: '英短',
        gender: 'female' as const,
        weight: 4.5,
      },
      {
        customerId: createdH5Customers[1].id,
        name: '大白',
        species: 'dog' as const,
        breed: '萨摩耶',
        gender: 'male' as const,
        weight: 22,
      },
      {
        customerId: createdH5Customers[2].id,
        name: '小黑',
        species: 'dog' as const,
        breed: '拉布拉多',
        gender: 'male' as const,
        weight: 28,
      },
    ];

    const createdH5Pets = await h5PetRepo.save(h5PetsData.map((p) => h5PetRepo.create(p)));

    // 获取服务
    const services = await serviceRepo.find({ where: { merchantId } });

    // 创建测试预约
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const h5Appointments = [
      {
        merchantId,
        h5CustomerId: createdH5Customers[0].id,
        h5PetId: createdH5Pets[0].id,
        serviceId: services[0]?.id,
        appointmentTime: new Date(today.getTime() + 10 * 60 * 60 * 1000),
        status: 'pending' as const,
        notes: 'H5测试预约1',
        createdBy: 'customer' as const,
      },
      {
        merchantId,
        h5CustomerId: createdH5Customers[0].id,
        h5PetId: createdH5Pets[1].id,
        serviceId: services[1]?.id,
        appointmentTime: new Date(today.getTime() + 14 * 60 * 60 * 1000),
        status: 'confirmed' as const,
        notes: 'H5测试预约2',
        createdBy: 'customer' as const,
      },
      {
        merchantId,
        h5CustomerId: createdH5Customers[1].id,
        h5PetId: createdH5Pets[2].id,
        serviceId: services[0]?.id,
        appointmentTime: new Date(today.getTime() + 16 * 60 * 60 * 1000),
        status: 'reschedule' as const,
        notes: 'H5测试预约3-改期中',
        proposedTime: new Date(today.getTime() + 18 * 60 * 60 * 1000),
        proposedBy: 'merchant' as const,
        createdBy: 'customer' as const,
      },
      {
        merchantId,
        h5CustomerId: createdH5Customers[2].id,
        h5PetId: createdH5Pets[3].id,
        serviceId: services[2]?.id,
        appointmentTime: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
        status: 'completed' as const,
        notes: 'H5测试预约4-已完成',
        createdBy: 'customer' as const,
      },
    ];

    const createdH5Appointments = await appointmentRepo.save(
      h5Appointments.map((a) => appointmentRepo.create(a)),
    );

    // 创建预约历史
    const historyData = [
      {
        appointmentId: createdH5Appointments[0].id,
        action: 'create' as const,
        operatorType: 'customer' as const,
        operatorId: createdH5Customers[0].id,
        operatorName: createdH5Customers[0].nickname || 'Customer',
        newTime: createdH5Appointments[0].appointmentTime,
      },
      {
        appointmentId: createdH5Appointments[1].id,
        action: 'create' as const,
        operatorType: 'customer' as const,
        operatorId: createdH5Customers[0].id,
        operatorName: createdH5Customers[0].nickname || 'Customer',
        newTime: createdH5Appointments[1].appointmentTime,
      },
      {
        appointmentId: createdH5Appointments[1].id,
        action: 'confirm' as const,
        operatorType: 'merchant' as const,
        operatorId: 'merchant',
        operatorName: '商家',
      },
      {
        appointmentId: createdH5Appointments[2].id,
        action: 'create' as const,
        operatorType: 'customer' as const,
        operatorId: createdH5Customers[1].id,
        operatorName: createdH5Customers[1].nickname || 'Customer',
        newTime: createdH5Appointments[2].appointmentTime,
      },
      {
        appointmentId: createdH5Appointments[2].id,
        action: 'reschedule' as const,
        operatorType: 'merchant' as const,
        operatorId: 'merchant',
        operatorName: '商家',
        oldTime: createdH5Appointments[2].appointmentTime,
        newTime: createdH5Appointments[2].proposedTime,
        notes: '商家提议改期',
      },
    ];

    await historyRepo.save(historyData.map((h) => historyRepo.create(h)));

    return {
      message: 'H5测试数据创建成功',
      h5Customers: createdH5Customers.length,
      h5Pets: createdH5Pets.length,
      h5Appointments: createdH5Appointments.length,
    };
  }
}
