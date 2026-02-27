const { Client } = require('pg');

async function runMigration() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '123456',
    database: 'petlianbao'
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // 检查字段是否已存在
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'customers' AND column_name = 'openid'
    `);

    if (checkResult.rows.length > 0) {
      console.log('openid column already exists, skipping migration');
      return;
    }

    // 添加 openid 字段
    await client.query(`
      ALTER TABLE customers 
      ADD COLUMN openid VARCHAR(64) NULL
    `);
    console.log('Added openid column to customers table');

    // 添加索引
    await client.query(`
      CREATE INDEX idx_customers_openid ON customers(openid)
    `);
    console.log('Created index on openid column');

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
