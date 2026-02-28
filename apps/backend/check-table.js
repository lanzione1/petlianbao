const { Client } = require('pg');

async function checkTable() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '123456',
    database: 'petlianbao'
  });

  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT column_name, is_nullable, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'appointments' 
      AND column_name IN ('customer_id', 'h5_customer_id')
    `);
    
    console.log('Appointments表结构:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? '可空' : '非空'})`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkTable();
