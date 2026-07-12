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
  accessTtl: process.env.ACCESS_TTL ?? '30d',
  refreshTtl: process.env.REFRESH_TTL ?? '30d',
  cookieName: process.env.COOKIE_NAME ?? 'fw_token',
  cookieSecure: (process.env.COOKIE_SECURE ?? 'true') === 'true',

  redisUrl: process.env.REDIS_URL ?? '',
  appWebUrl: process.env.APP_WEB_URL ?? 'http://localhost:5173/finwise-app',
  emailFrom: process.env.EMAIL_FROM ?? 'Finwise <no-reply@example.com>',
  resendApiKey: process.env.RESEND_API_KEY ?? '',
  monthlyCron: process.env.MONTHLY_CRON ?? '0 8 1 * *',
  corsOrigins:
    (process.env.CORS_ORIGINS ?? '*') === '*'
      ? true
      : (process.env.CORS_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean),
}
