const { Client } = require('pg');

async function syncAllH5Customers() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '123456',
    database: 'petlianbao'
  });

  try {
    await client.connect();
    console.log('=== 同步所有H5客户到正式客户表 ===\n');

    // 1. 获取所有H5客户
    const h5Customers = await client.query('SELECT * FROM h5_customers');
    console.log(`找到 ${h5Customers.rows.length} 个H5客户\n`);

    let created = 0;
    let existing = 0;

    for (const h5 of h5Customers.rows) {
      // 检查是否已有正式客户
      const formalCheck = await client.query(
        'SELECT * FROM customers WHERE openid::text = $1 AND merchant_id::text = $2',
        [h5.openid, h5.merchant_id]
      );

      if (formalCheck.rows.length > 0) {
        existing++;
        console.log(`✓ ${h5.nickname}: 已存在正式客户`);
      } else {
        // 创建正式客户
        await client.query(`
          INSERT INTO customers (
            merchant_id, openid, pet_name, phone, gender, notes, tags, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        `, [
          h5.merchant_id,
          h5.openid,
          h5.nickname || 'H5客户',
          h5.phone,
          'unknown',
          `来源：H5微信授权 | 客户昵称：${h5.nickname || '未设置'} | 同步时间：${new Date().toLocaleString()}`,
          JSON.stringify(['H5客户'])
        ]);
        created++;
        console.log(`✅ ${h5.nickname}: 创建正式客户成功`);
      }
    }

    console.log(`\n=== 同步完成 ===`);
    console.log(`新创建: ${created}`);
    console.log(`已存在: ${existing}`);
    console.log(`总计: ${h5Customers.rows.length}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

syncAllH5Customers();
