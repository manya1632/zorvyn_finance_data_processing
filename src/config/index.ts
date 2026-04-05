import dotenv from 'dotenv';

dotenv.config();

const requiredVars = ['DATABASE_URL', 'JWT_SECRET'] as const;

for (const varName of requiredVars) {
  if (!process.env[varName]) {
    console.error(`[config] Missing required environment variable: ${varName}`);
    process.exit(1);
  }
}

export const config = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl: process.env.DATABASE_URL!,
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN ?? '24h',
  },
  log: {
    level: process.env.LOG_LEVEL ?? 'info',
  },
  cors: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS ?? '*').split(',').map((s) => s.trim()),
  },
  cache: {
    ttlSeconds: parseInt(process.env.CACHE_TTL_SECONDS ?? '60', 10),
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX ?? '10', 10),
  },
} as const;
