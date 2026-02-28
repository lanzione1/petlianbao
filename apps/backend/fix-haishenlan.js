const { Client } = require('pg');

async function fixHaishenlan() {
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

    // 1. 获取海深蓝信息
    const h5Customer = await client.query(
      'SELECT * FROM h5_customers WHERE nickname = $1',
      ['海深蓝']
    );

    if (h5Customer.rows.length === 0) {
      console.log('未找到海深蓝');
      return;
    }

    const h5 = h5Customer.rows[0];
    console.log('H5客户:', {
      id: h5.id,
      nickname: h5.nickname,
      openid: h5.openid,
      merchant_id: h5.merchant_id
    });

    // 2. 检查是否已有正式客户
    const existingFormal = await client.query(
      'SELECT * FROM customers WHERE openid::text = $1 AND merchant_id::text = $2',
      [h5.openid, h5.merchant_id]
    );

    let formalId;
    if (existingFormal.rows.length > 0) {
      formalId = existingFormal.rows[0].id;
      console.log('已存在正式客户:', formalId);
    } else {
      // 3. 创建正式客户
      const newFormal = await client.query(`
        INSERT INTO customers (
          merchant_id, openid, pet_name, phone, gender, notes, tags, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING id
      `, [
        h5.merchant_id,
        h5.openid,
        h5.nickname || 'H5客户',
        h5.phone,
        'unknown',
        `来源：H5微信授权 | 客户昵称：${h5.nickname || '未设置'}`,
        JSON.stringify(['H5客户'])
      ]);
      formalId = newFormal.rows[0].id;
      console.log('✅ 创建正式客户成功:', formalId);
    }

    // 4. 获取服务
    const service = await client.query(
      'SELECT * FROM services WHERE merchant_id::text = $1 LIMIT 1',
      [h5.merchant_id]
    );

    if (service.rows.length === 0) {
      console.log('该商家没有服务');
      return;
    }

    // 5. 创建预约（同时关联正式客户和H5客户）
    const appointmentTime = new Date();
    appointmentTime.setDate(appointmentTime.getDate() + 1);
    appointmentTime.setHours(14, 0, 0, 0);

    const newAppointment = await client.query(`
      INSERT INTO appointments (
        merchant_id, customer_id, h5_customer_id, service_id, 
        appointment_time, status, notes, created_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *
    `, [
      h5.merchant_id,
      formalId,
      h5.id,
      service.rows[0].id,
      appointmentTime,
      'pending',
      '测试预约 - 数据修复',
      'customer'
    ]);

    console.log('\n✅ 预约创建成功:', {
      id: newAppointment.rows[0].id,
      customer_id: newAppointment.rows[0].customer_id,
      h5_customer_id: newAppointment.rows[0].h5_customer_id,
      status: newAppointment.rows[0].status
    });

    // 6. 验证
    const verify = await client.query(`
      SELECT a.*, s.name as service_name, h.nickname as h5_nickname, c.pet_name as formal_name
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN h5_customers h ON a.h5_customer_id = h.id
      LEFT JOIN customers c ON a.customer_id = c.id
      WHERE a.h5_customer_id::text = $1
      ORDER BY a.created_at DESC
    `, [h5.id]);

    console.log(`\n📋 海深蓝共有 ${verify.rows.length} 条预约:`);
    verify.rows.forEach((apt, i) => {
      console.log(`  ${i + 1}. 服务: ${apt.service_name}, 状态: ${apt.status}`);
      console.log(`     正式客户: ${apt.formal_name}, H5客户: ${apt.h5_nickname}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

fixHaishenlan();
