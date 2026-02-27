const { Client } = require('pg');

async function checkCustomer() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '123456',
    database: 'petlianbao'
  });

  const customerId = 'b31c2e80-5f89-442a-95a5-7a6c3c28b803';

  try {
    await client.connect();
    console.log('Connected to database\n');

    // 1. 查询客户信息
    console.log('=== 客户信息 ===');
    const customerResult = await client.query(
      'SELECT * FROM customers WHERE id = $1',
      [customerId]
    );
    console.log(customerResult.rows[0] || '客户不存在');

    // 2. 查询客户的预约
    console.log('\n=== 正式客户预约 ===');
    const appointmentsResult = await client.query(
      'SELECT * FROM appointments WHERE customer_id = $1',
      [customerId]
    );
    console.log(`找到 ${appointmentsResult.rows.length} 条预约`);
    appointmentsResult.rows.forEach(a => {
      console.log(`  - ID: ${a.id}, Status: ${a.status}`);
    });

    // 3. 查询H5客户预约
    if (customerResult.rows[0]?.openid) {
      console.log('\n=== H5客户预约 ===');
      const h5AppointmentsResult = await client.query(
        `SELECT a.* FROM appointments a 
         JOIN h5_customers h ON a.h5_customer_id = h.id 
         WHERE h.openid = $1`,
        [customerResult.rows[0].openid]
      );
      console.log(`找到 ${h5AppointmentsResult.rows.length} 条H5预约`);
      h5AppointmentsResult.rows.forEach(a => {
        console.log(`  - ID: ${a.id}, Status: ${a.status}`);
      });
    }

    // 4. 查询交易记录
    console.log('\n=== 交易记录 ===');
    const transactionsResult = await client.query(
      'SELECT * FROM transactions WHERE customer_id = $1',
      [customerId]
    );
    console.log(`找到 ${transactionsResult.rows.length} 条交易记录`);

    // 5. 查询宠物记录
    console.log('\n=== 宠物记录 ===');
    const petsResult = await client.query(
      'SELECT * FROM pets WHERE customer_id = $1',
      [customerId]
    );
    console.log(`找到 ${petsResult.rows.length} 条宠物记录`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkCustomer();
