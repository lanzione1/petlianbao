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

export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    type: process.env.DATABASE_TYPE || 'mysql',
    // 优先使用自定义配置，其次使用微信云托管自动注入的 MySQL 环境变量
    // 微信云托管使用 MYSQL_ADDRESS (格式: host:port)，需要解析
    host: process.env.DATABASE_HOST || parseMysqlAddress(process.env.MYSQL_ADDRESS).host || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || parseMysqlAddress(process.env.MYSQL_ADDRESS).port || '3306', 10),
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
