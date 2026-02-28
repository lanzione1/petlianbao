import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOpenidToCustomer1740604560000 implements MigrationInterface {
  name = 'AddOpenidToCustomer1740604560000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 添加 openid 字段到 customers 表
    await queryRunner.query(`
      ALTER TABLE customers 
      ADD COLUMN IF NOT EXISTS openid VARCHAR(64) NULL
    `);

    // 添加索引以便快速查找
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_customers_openid 
      ON customers(openid)
    `);

    console.log('Added openid column to customers table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除索引
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_customers_openid
    `);

    // 删除字段
    await queryRunner.query(`
      ALTER TABLE customers 
      DROP COLUMN IF EXISTS openid
    `);

    console.log('Removed openid column from customers table');
  }
}
