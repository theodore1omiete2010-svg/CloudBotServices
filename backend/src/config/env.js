import 'dotenv/config';

const required = ['DATABASE_URL', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) console.warn(`[CBS] Missing ${key}. Some operations will fail until it is configured.`);
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 10000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'development-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  frontendOrigin: process.env.FRONTEND_ORIGIN || '',
  cookieSecure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
  verificationTtlMinutes: Number(process.env.VERIFICATION_CODE_TTL_MINUTES || 10),
  resetTtlMinutes: Number(process.env.RESET_TOKEN_TTL_MINUTES || 15)
};
