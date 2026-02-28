const { Client } = require('pg');

async function testH5Appointment() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '123456',
    database: 'petlianbao'
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    // 1. 获取海深蓝的信息
    const h5Customer = await client.query(
      'SELECT * FROM h5_customers WHERE nickname = $1',
      ['海深蓝']
    );

    if (h5Customer.rows.length === 0) {
      console.log('未找到海深蓝客户');
      return;
    }

    const customer = h5Customer.rows[0];
    console.log('海深蓝客户信息:', {
      id: customer.id,
      nickname: customer.nickname,
      merchantId: customer.merchant_id
    });

    // 2. 获取商家的服务
    const services = await client.query(
      'SELECT * FROM services WHERE merchant_id = $1 LIMIT 1',
      [customer.merchant_id]
    );

    if (services.rows.length === 0) {
      console.log('该商家没有服务');
      return;
    }

    const service = services.rows[0];
    console.log('服务信息:', {
      id: service.id,
      name: service.name
    });

    // 3. 创建预约（模拟H5 API创建）
    const appointmentTime = new Date();
    appointmentTime.setDate(appointmentTime.getDate() + 1); // 明天
    appointmentTime.setHours(10, 0, 0, 0);

    const appointmentResult = await client.query(`
      INSERT INTO appointments (
        merchant_id, h5_customer_id, service_id, appointment_time, 
        status, notes, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `, [
      customer.merchant_id,
      customer.id,
      service.id,
      appointmentTime,
      'pending',
      '测试预约',
      'customer'
    ]);

    console.log('\n✅ 预约创建成功:', {
      id: appointmentResult.rows[0].id,
      h5CustomerId: appointmentResult.rows[0].h5_customer_id,
      status: appointmentResult.rows[0].status,
      appointmentTime: appointmentResult.rows[0].appointment_time
    });

    // 4. 验证查询
    const verifyQuery = await client.query(`
      SELECT a.*, s.name as service_name, h.nickname as customer_nickname
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN h5_customers h ON a.h5_customer_id = h.id
      WHERE a.h5_customer_id = $1
      ORDER BY a.created_at DESC
    `, [customer.id]);

    console.log(`\n📋 海深蓝共有 ${verifyQuery.rows.length} 条预约:`);
    verifyQuery.rows.forEach((apt, i) => {
      console.log(`  ${i + 1}. 服务: ${apt.service_name}, 状态: ${apt.status}, 时间: ${apt.appointment_time}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

testH5Appointment();
