import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url().or(z.string().min(1)),
  SESSION_SECRET: z.string().min(16).or(z.string().default('e2e-test-only-secret')),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  AI_PROVIDER: z.enum(['none', 'openai']).default('none'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  SESSION_COOKIE_SECURE: z.string().default('true'),
});

export const env = envSchema.parse(process.env);
