export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'petlianbao',
    password: process.env.DATABASE_PASSWORD || 'petlianbao123',
    database: process.env.DATABASE_NAME || 'petlianbao',
    ssl: process.env.DATABASE_SSL === 'true',
    sslRejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    tls: process.env.REDIS_TLS === 'true',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  wechat: {
    appId: process.env.WECHAT_APP_ID || '',
    appSecret: process.env.WECHAT_APP_SECRET || '',
    testAppId: process.env.WECHAT_TEST_APP_ID || '',
    testAppSecret: process.env.WECHAT_TEST_APP_SECRET || '',
    oauthRedirect: process.env.WECHAT_OAUTH_REDIRECT || '',
  },
  nodeEnv: process.env.NODE_ENV || 'development',
});
