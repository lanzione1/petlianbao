import { DataSource } from 'typeorm';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: '123456',
  database: 'petlianbao',
});

async function seed() {
  await AppDataSource.initialize();
  console.log('Database connected');

  const now = new Date();
  const dates = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(9 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));
    return d;
  });

  // 1. 创建商家
  console.log('Creating merchants...');
  const merchants = [
    {
      id: 'a0000000-0000-0000-0000-000000000001',
      shopName: '萌宠乐园',
      phone: '13800138001',
      planType: 'professional',
    },
    {
      id: 'a0000000-0000-0000-0000-000000000002',
      shopName: '爱宠之家',
      phone: '13800138002',
      planType: 'basic',
    },
    {
      id: 'a0000000-0000-0000-0000-000000000003',
      shopName: '小可爱宠物店',
      phone: '13800138003',
      planType: 'free',
    },
    {
      id: 'a0000000-0000-0000-0000-000000000004',
      shopName: '宠物世界',
      phone: '13800138004',
      planType: 'enterprise',
    },
    {
      id: 'a0000000-0000-0000-0000-000000000005',
      shopName: '喵汪星球',
      phone: '13800138005',
      planType: 'professional',
    },
    {
      id: 'a0000000-0000-0000-0000-000000000006',
      shopName: '快乐宠物',
      phone: '13800138006',
      planType: 'basic',
    },
    {
      id: 'a0000000-0000-0000-0000-000000000007',
      shopName: '萌宠阁',
      phone: '13800138007',
      planType: 'free',
    },
    {
      id: 'a0000000-0000-0000-0000-000000000008',
      shopName: '宠物驿站',
      phone: '13800138008',
      planType: 'professional',
    },
    {
      id: 'a0000000-0000-0000-0000-000000000009',
      shopName: '爱心宠物店',
      phone: '13800138009',
      planType: 'banned',
    },
    {
      id: 'a0000000-0000-0000-0000-000000000010',
      shopName: '毛孩子俱乐部',
      phone: '13800138010',
      planType: 'basic',
    },
  ];

  for (const m of merchants) {
    await AppDataSource.query(
      `
      INSERT INTO merchants (id, openid, shop_name, phone, address, plan_type, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET shop_name = EXCLUDED.shop_name, plan_type = EXCLUDED.plan_type
    `,
      [
        m.id,
        `seed_${m.id}`,
        m.shopName,
        m.phone,
        `北京市朝阳区xxx路${Math.floor(Math.random() * 100)}号`,
        m.planType,
        dates[Math.floor(Math.random() * 30)],
        now,
      ],
    );
  }
  console.log(`Created ${merchants.length} merchants`);

  // 2. 创建客户
  console.log('Creating customers...');
  const petNames = [
    '豆豆',
    '旺财',
    '小黑',
    '小白',
    '大黄',
    '毛毛',
    '球球',
    '咪咪',
    '欢欢',
    '乐乐',
    '多多',
    '花花',
    '虎子',
    '妞妞',
    '嘟嘟',
  ];
  const breeds = [
    '金毛',
    '泰迪',
    '柯基',
    '哈士奇',
    '布偶猫',
    '英短',
    '比熊',
    '博美',
    '柴犬',
    '橘猫',
  ];
  let customerId = 1;
  for (const merchant of merchants.filter((m) => m.planType !== 'banned')) {
    const customerCount = 10 + Math.floor(Math.random() * 20);
    for (let i = 0; i < customerCount; i++) {
      const id = `20000000-0000-0000-${String(customerId).padStart(4, '0')}-${String(customerId).padStart(12, '0')}`;
      const petName = petNames[Math.floor(Math.random() * petNames.length)];
      const breed = breeds[Math.floor(Math.random() * breeds.length)];
      const totalSpent = (Math.floor(Math.random() * 50) + 1) * 100;
      await AppDataSource.query(
        `
        INSERT INTO customers (id, merchant_id, pet_name, pet_breed, phone, total_spent, visit_count, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO NOTHING
      `,
        [
          id,
          merchant.id,
          petName,
          breed,
          `139${Math.floor(Math.random() * 100000000)
            .toString()
            .padStart(8, '0')}`,
          totalSpent,
          Math.floor(Math.random() * 20) + 1,
          dates[Math.floor(Math.random() * 30)],
        ],
      );
      customerId++;
    }
  }
  console.log(`Created ${customerId - 1} customers`);

  // 3. 创建服务
  console.log('Creating services...');
  const services = [
    { name: '宠物洗澡', price: 5000 },
    { name: '宠物美容', price: 15000 },
    { name: '宠物寄养', price: 8000 },
    { name: '宠物医疗', price: 20000 },
    { name: '宠物训练', price: 30000 },
    { name: '上门服务', price: 12000 },
  ];
  let serviceId = 1;
  for (const merchant of merchants.filter((m) => m.planType !== 'banned')) {
    for (const svc of services) {
      const id = `30000000-0000-0000-${String(serviceId).padStart(4, '0')}-${String(serviceId).padStart(12, '0')}`;
      await AppDataSource.query(
        `
        INSERT INTO services (id, merchant_id, name, price, duration, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `,
        [
          id,
          merchant.id,
          svc.name,
          svc.price,
          30 + Math.floor(Math.random() * 60),
          dates[Math.floor(Math.random() * 30)],
        ],
      );
      serviceId++;
    }
  }
  console.log(`Created ${serviceId - 1} services`);

  // 4. 创建预约
  console.log('Creating appointments...');
  const statuses = [
    'pending',
    'completed',
    'paid',
    'cancelled_by_merchant',
    'cancelled_by_customer',
  ];
  let appointmentId = 1;

  const existingCustomers = await AppDataSource.query(
    `SELECT id, merchant_id FROM customers LIMIT 200`,
  );
  const existingServices = await AppDataSource.query(
    `SELECT id, merchant_id FROM services LIMIT 100`,
  );

  for (const merchant of merchants.filter((m) => m.planType !== 'banned')) {
    const merchantCustomers = existingCustomers.filter((c: any) => c.merchant_id === merchant.id);
    const merchantServices = existingServices.filter((s: any) => s.merchant_id === merchant.id);

    const appointmentCount = 20 + Math.floor(Math.random() * 50);
    for (let i = 0; i < appointmentCount; i++) {
      const id = `40000000-0000-0000-${String(appointmentId).padStart(4, '0')}-${String(appointmentId).padStart(12, '0')}`;
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const date = new Date(dates[Math.floor(Math.random() * 30)]);
      date.setHours(9 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));

      const customerId =
        merchantCustomers.length > 0
          ? merchantCustomers[Math.floor(Math.random() * merchantCustomers.length)].id
          : null;
      const serviceId =
        merchantServices.length > 0
          ? merchantServices[Math.floor(Math.random() * merchantServices.length)].id
          : null;

      await AppDataSource.query(
        `
        INSERT INTO appointments (id, merchant_id, customer_id, service_id, appointment_time, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING
      `,
        [
          id,
          merchant.id,
          customerId,
          serviceId,
          date,
          status,
          dates[Math.floor(Math.random() * 30)],
        ],
      );
      appointmentId++;
    }
  }
  console.log(`Created ${appointmentId - 1} appointments`);

  // 5. 创建交易
  console.log('Creating transactions...');
  const paymentMethods = ['wechat', 'alipay', 'cash', 'member'];
  let transactionId = 1;

  for (const merchant of merchants.filter((m) => m.planType !== 'banned')) {
    const merchantCustomers = existingCustomers.filter((c: any) => c.merchant_id === merchant.id);

    const transactionCount = 30 + Math.floor(Math.random() * 70);
    for (let i = 0; i < transactionCount; i++) {
      const id = `50000000-0000-0000-${String(transactionId).padStart(4, '0')}-${String(transactionId).padStart(12, '0')}`;
      const amount = (30 + Math.floor(Math.random() * 300)) * 100;
      const date = dates[Math.floor(Math.random() * 30)];
      const customerId =
        merchantCustomers.length > 0
          ? merchantCustomers[Math.floor(Math.random() * merchantCustomers.length)].id
          : null;
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

      await AppDataSource.query(
        `
        INSERT INTO transactions (id, merchant_id, customer_id, items, total_amount, payment_method, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING
      `,
        [
          id,
          merchant.id,
          customerId,
          JSON.stringify([{ name: '服务', price: amount, quantity: 1 }]),
          amount,
          paymentMethod,
          date,
        ],
      );
      transactionId++;
    }
  }
  console.log(`Created ${transactionId - 1} transactions`);

  // 6. 创建提现记录
  console.log('Creating withdrawals...');
  const withdrawalStatuses = ['pending', 'completed', 'failed'];
  let withdrawalId = 1;
  for (const merchant of merchants.filter((m) => m.planType !== 'banned')) {
    const withdrawalCount = 2 + Math.floor(Math.random() * 5);
    for (let i = 0; i < withdrawalCount; i++) {
      const id = `60000000-0000-0000-${String(withdrawalId).padStart(4, '0')}-${String(withdrawalId).padStart(12, '0')}`;
      const amount = (1000 + Math.floor(Math.random() * 5000)) * 100;
      const status = withdrawalStatuses[Math.floor(Math.random() * withdrawalStatuses.length)];
      const date = dates[Math.floor(Math.random() * 30)];

      await AppDataSource.query(
        `
        INSERT INTO withdrawals (id, merchant_id, amount, bank_name, bank_account, account_name, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING
      `,
        [
          id,
          merchant.id,
          amount,
          '中国工商银行',
          `6222${Math.floor(Math.random() * 10000000000000)
            .toString()
            .padStart(14, '0')}`,
          merchant.shopName,
          status,
          date,
          now,
        ],
      );
      withdrawalId++;
    }
  }
  console.log(`Created ${withdrawalId - 1} withdrawals`);

  // 7. 创建素材
  console.log('Creating media...');
  const mediaTypes = ['image', 'video', 'document'];
  let mediaId = 1;
  for (const merchant of merchants.filter((m) => m.planType !== 'banned')) {
    const mediaCount = 5 + Math.floor(Math.random() * 15);
    for (let i = 0; i < mediaCount; i++) {
      const id = `70000000-0000-0000-${String(mediaId).padStart(4, '0')}-${String(mediaId).padStart(12, '0')}`;
      const type = mediaTypes[Math.floor(Math.random() * mediaTypes.length)];
      const size = (10 + Math.floor(Math.random() * 500)) * 1024;

      await AppDataSource.query(
        `
        INSERT INTO media (id, merchant_id, type, name, url, size, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING
      `,
        [
          id,
          merchant.id,
          type,
          `${type}_${i + 1}.${type === 'image' ? 'jpg' : type === 'video' ? 'mp4' : 'pdf'}`,
          `https://example.com/${type}/${id}`,
          size,
          dates[Math.floor(Math.random() * 30)],
        ],
      );
      mediaId++;
    }
  }
  console.log(`Created ${mediaId - 1} media files`);

  // 8. 创建操作日志
  console.log('Creating admin logs...');

  const existingAdmin = await AppDataSource.query(`SELECT id FROM admins LIMIT 1`);
  const adminId = existingAdmin.length > 0 ? existingAdmin[0].id : null;

  if (adminId) {
    const actions = ['login', 'ban', 'unban', 'update_plan'];
    let logId = 1;
    for (let i = 0; i < 50; i++) {
      const id = `80000000-0000-0000-${String(logId).padStart(4, '0')}-${String(logId).padStart(12, '0')}`;
      const action = actions[Math.floor(Math.random() * actions.length)];
      const merchant = merchants[Math.floor(Math.random() * merchants.length)];

      await AppDataSource.query(
        `
        INSERT INTO admin_logs (id, admin_id, action, target_type, target_id, detail, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING
      `,
        [
          id,
          adminId,
          action,
          'merchant',
          merchant.id,
          JSON.stringify({ shopName: merchant.shopName }),
          dates[Math.floor(Math.random() * 30)],
        ],
      );
      logId++;
    }
    console.log(`Created ${logId - 1} admin logs`);
  } else {
    console.log('No admin found, skipping logs');
  }

  console.log('\n✅ Seed completed!');
  console.log('\nAdmin Login: admin / admin123456');

  await AppDataSource.destroy();
}

seed().catch(console.error);
