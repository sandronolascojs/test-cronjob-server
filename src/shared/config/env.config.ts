import { z } from 'zod'

const rawEnv = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: Number(process.env.PORT),
  DATABASE_URL: process.env.DATABASE_URL,
  EMAIL_SERVICE_URL: process.env.EMAIL_SERVICE_URL,
  FRONTEND_URL: process.env.FRONTEND_URL,
}

const envSchema = z
  .object({
    NODE_ENV: z
      .string({
        invalid_type_error: 'NODE_ENV must be a string',
      })
      .default('development'),
    PORT: z.number().min(0).max(65535),
    DATABASE_URL: z.string({
      required_error: 'DATABASE_URL is required',
    }),
    EMAIL_SERVICE_URL: z.string({
      required_error: 'EMAIL_SERVICE_URL is required',
    }),
    FRONTEND_URL: z.string({
      required_error: 'FRONTEND_URL is required',
    }),
  })
  .strict()

const _env = envSchema.safeParse(rawEnv)

if (!_env.success) throw new Error('Invalid environment variables')

export const env = _env.data
