// 解析微信云托管 MYSQL_ADDRESS 环境变量 (格式: host:port)
function parseMysqlAddress(address: string | undefined): { host: string; port: string } {
  if (!address) {
    return { host: '', port: '' };
  }
  const parts = address.split(':');
  return {
    host: parts[0] || '',
    port: parts[1] || '',
  };
}

// 获取数据库主机地址
function getDatabaseHost(): string {
  // 优先使用自定义配置
  if (process.env.DATABASE_HOST) {
    return process.env.DATABASE_HOST;
  }
  // 其次使用微信云托管自动注入的 MYSQL_ADDRESS
  const mysqlAddress = process.env.MYSQL_ADDRESS;
  if (mysqlAddress) {
    const { host } = parseMysqlAddress(mysqlAddress);
    if (host) {
      console.log('[Config] Using MYSQL_ADDRESS host:', host);
      return host;
    }
  }
  console.log('[Config] Using default localhost for database host');
  return 'localhost';
}

// 获取数据库端口
function getDatabasePort(): number {
  // 优先使用自定义配置
  if (process.env.DATABASE_PORT) {
    return parseInt(process.env.DATABASE_PORT, 10);
  }
  // 其次使用微信云托管自动注入的 MYSQL_ADDRESS
  const mysqlAddress = process.env.MYSQL_ADDRESS;
  if (mysqlAddress) {
    const { port } = parseMysqlAddress(mysqlAddress);
    if (port) {
      console.log('[Config] Using MYSQL_ADDRESS port:', port);
      return parseInt(port, 10);
    }
  }
  return 3306;
}

// 打印环境变量调试信息（仅打印存在性，不打印敏感信息）
console.log('[Config] Environment check:');
console.log('[Config] MYSQL_ADDRESS exists:', !!process.env.MYSQL_ADDRESS);
console.log('[Config] MYSQL_USERNAME exists:', !!process.env.MYSQL_USERNAME);
console.log('[Config] MYSQL_PASSWORD exists:', !!process.env.MYSQL_PASSWORD);
console.log('[Config] DATABASE_HOST exists:', !!process.env.DATABASE_HOST);
console.log('[Config] WX_APPID exists:', !!process.env.WX_APPID);

export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    type: process.env.DATABASE_TYPE || 'mysql',
    // 优先使用自定义配置，其次使用微信云托管自动注入的 MySQL 环境变量
    host: getDatabaseHost(),
    port: getDatabasePort(),
    username: process.env.DATABASE_USER || process.env.MYSQL_USERNAME || 'root',
    password: process.env.DATABASE_PASSWORD || process.env.MYSQL_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'petlianbao',
    ssl: process.env.DATABASE_SSL === 'true',
    sslRejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false',
  },
  redis: {
    // 优先使用自定义配置，其次使用微信云托管自动注入的 Redis 环境变量
    host: process.env.REDIS_HOST || process.env.REDIS_ADDRESS || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    tls: process.env.REDIS_TLS === 'true',
  },
  jwt: {
    // 优先使用自定义 JWT_SECRET，其次使用微信云托管的 WX_APPID 作为备选
    secret: process.env.JWT_SECRET || process.env.WX_APPID || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  wechat: {
    // 优先使用自定义配置，其次使用微信云托管自动注入的 WX_APPID 和 WX_SECRET
    appId: process.env.WECHAT_APP_ID || process.env.WX_APPID || '',
    appSecret: process.env.WECHAT_APP_SECRET || process.env.WX_SECRET || '',
    testAppId: process.env.WECHAT_TEST_APP_ID || '',
    testAppSecret: process.env.WECHAT_TEST_APP_SECRET || '',
    oauthRedirect: process.env.WECHAT_OAUTH_REDIRECT || '',
  },
  nodeEnv: process.env.NODE_ENV || 'development',
});
