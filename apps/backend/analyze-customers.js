const { Client } = require('pg');

async function analyzeCustomers() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '123456',
    database: 'petlianbao'
  });

  try {
    await client.connect();
    console.log('=== 客户体系分析 ===\n');

    // 1. 正式客户数量
    const formalCount = await client.query('SELECT COUNT(*) as count FROM customers');
    console.log('1. 正式客户 (customers表):', formalCount.rows[0].count, '条');

    // 2. H5客户数量
    const h5Count = await client.query('SELECT COUNT(*) as count FROM h5_customers');
    console.log('2. H5客户 (h5_customers表):', h5Count.rows[0].count, '条');

    // 3. 通过openid关联的客户
    const linkedCount = await client.query(`
      SELECT COUNT(*) as count 
      FROM customers c
      INNER JOIN h5_customers h ON c.openid::text = h.openid::text
    `);
    console.log('3. 已关联的客户 (openid相同):', linkedCount.rows[0].count, '条');

    // 4. 海深蓝的情况
    const haishenlan = await client.query(`
      SELECT 
        h.id as h5_id, 
        h.nickname as h5_nickname,
        h.openid,
        h.merchant_id,
        c.id as formal_id,
        c.pet_name as formal_pet_name
      FROM h5_customers h
      LEFT JOIN customers c ON h.openid::text = c.openid::text AND h.merchant_id::text = c.merchant_id::text
      WHERE h.nickname = '海深蓝'
    `);
    
    console.log('\n4. 海深蓝客户信息:');
    if (haishenlan.rows.length > 0) {
      const info = haishenlan.rows[0];
      console.log('  H5客户ID:', info.h5_id);
      console.log('  微信昵称:', info.h5_nickname);
      console.log('  OpenID:', info.openid);
      console.log('  正式客户ID:', info.formal_id || '未创建');
    }

    // 5. 预约关联情况
    const appointmentStats = await client.query(`
      SELECT 
        COUNT(CASE WHEN customer_id IS NOT NULL THEN 1 END) as with_formal,
        COUNT(CASE WHEN h5_customer_id IS NOT NULL THEN 1 END) as with_h5,
        COUNT(CASE WHEN customer_id IS NOT NULL AND h5_customer_id IS NOT NULL THEN 1 END) as with_both
      FROM appointments
    `);
    
    console.log('\n5. 预约关联情况:');
    console.log('  关联正式客户:', appointmentStats.rows[0].with_formal);
    console.log('  关联H5客户:', appointmentStats.rows[0].with_h5);
    console.log('  同时关联两者:', appointmentStats.rows[0].with_both);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

analyzeCustomers();
