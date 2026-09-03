import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DB_PATH: z.string().default('./data/pos.sqlite'),
  JWT_SECRET: z.string().min(16).default('pos-super-secret-jwt-key-change-in-prod-minimum-32'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:3000'),
  DEFAULT_SHOP_ID: z.string().default('11111111-1111-1111-1111-111111111111'),
  DEFAULT_BRANCH_ID: z.string().default('22222222-2222-2222-2222-222222222222'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format())
  throw new Error('Invalid environment configuration')
}

export const env = parsed.data
