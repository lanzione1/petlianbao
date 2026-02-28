const { Client } = require('pg');

async function checkAppointments() {
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

    // 1. 查询所有H5客户
    console.log('=== H5客户列表 ===');
    const h5Customers = await client.query('SELECT id, nickname, openid, merchant_id, created_at FROM h5_customers ORDER BY created_at DESC LIMIT 5');
    console.log(`找到 ${h5Customers.rows.length} 个H5客户`);
    h5Customers.rows.forEach(c => {
      console.log(`  - ID: ${c.id}, 昵称: ${c.nickname}, 商家: ${c.merchant_id}`);
    });

    // 2. 查询海深蓝的预约
    console.log('\n=== 海深蓝预约 ===');
    const haishenlan = await client.query(`
      SELECT h.id, h.nickname, h.openid, h.merchant_id
      FROM h5_customers h
      WHERE h.nickname = '海深蓝'
    `);
    
    if (haishenlan.rows.length > 0) {
      const customer = haishenlan.rows[0];
      console.log('客户信息:', customer);
      
      const appointments = await client.query(`
        SELECT a.id, a.h5_customer_id, a.status, a.appointment_time, 
               s.name as service_name
        FROM appointments a
        LEFT JOIN services s ON a.service_id = s.id
        WHERE a.h5_customer_id = $1
        ORDER BY a.created_at DESC
      `, [customer.id]);
      
      console.log(`找到 ${appointments.rows.length} 条预约`);
      appointments.rows.forEach(a => {
        console.log(`  - ID: ${a.id}, 服务: ${a.service_name}, 状态: ${a.status}`);
      });
    } else {
      console.log('未找到海深蓝客户记录');
    }

    // 3. 检查是否有h5_customer_id为NULL的预约
    console.log('\n=== 检查预约关联 ===');
    const nullCheck = await client.query(`
      SELECT COUNT(*) as total,
             COUNT(h5_customer_id) as with_customer,
             COUNT(CASE WHEN h5_customer_id IS NULL THEN 1 END) as without_customer
      FROM appointments
    `);
    console.log('预约关联情况:', nullCheck.rows[0]);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkAppointments();
