import 'dotenv/config'

function required(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required env var: ${name}`)
  return v
}

export const config = {
  port: parseInt(process.env.PORT ?? '8080', 10),
  host: process.env.HOST ?? '0.0.0.0',
  isProd: process.env.NODE_ENV === 'production',

  mongoUri: required('MONGO_URI'),
  dbName: process.env.DB_NAME ?? 'finwise',

  jwtSecret: required('JWT_SECRET'),
  accessTtl: process.env.ACCESS_TTL ?? '15m',
  refreshTtl: process.env.REFRESH_TTL ?? '30d',
  cookieName: process.env.COOKIE_NAME ?? 'fw_token',
  cookieSecure: (process.env.COOKIE_SECURE ?? 'true') === 'true',

  redisUrl: process.env.REDIS_URL ?? '',
  corsOrigins:
    (process.env.CORS_ORIGINS ?? '*') === '*'
      ? true
      : (process.env.CORS_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean),
}
