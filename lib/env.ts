/**
 * Type-safe environment variables
 * Validates on app startup - fails fast if misconfigured
 */

import { z } from 'zod'

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1),  // Removed .url() check as it fails on some valid URLs

  // Auth
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().min(1),
  AUTH_TRUST_HOST: z.string().optional(),  // Relaxed validation for flexibility

  // OAuth (optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Storage
  STORAGE_PROVIDER: z.enum(['local', 's3']).default('local'),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_S3_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),

  // Rate limiting (optional — Upstash Redis for production multi-instance)
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // App
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
})

// Validate environment variables
function validateEnv() {
  if (process.env.NODE_ENV === 'test') {
    return envSchema.parse({
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'test-secret-32-characters-long!!!',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      NODE_ENV: 'test',
      STORAGE_PROVIDER: 'local',
    })
  }

  // Skip strict validation during Next.js build (env vars set at runtime)
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return envSchema.parse({
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://build:build@localhost:5432/build',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'build-time-placeholder-secret-32chars!!',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      NODE_ENV: 'production',
      STORAGE_PROVIDER: 'local',
    })
  }

  try {
    const env = envSchema.parse(process.env)
    return env
  } catch (error) {
    console.error('❌ Invalid environment variables:')
    console.error(error)
    throw new Error('Environment validation failed')
  }
}

export const env = validateEnv()

// Type-safe env vars throughout the app
export type Env = z.infer<typeof envSchema>
