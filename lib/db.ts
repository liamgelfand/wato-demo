/**
 * Prisma Database Client with Connection Pooling
 * 
 * Configured for production scale with:
 * - Connection pooling via pg-pool
 * - Automatic reconnection
 * - Query logging in development
 * - Graceful shutdown handling
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { logger } from './logger'

const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: pg.Pool | undefined
}

// Configure connection pool with optimized settings
const pool = globalForPrisma.pool ?? new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  // Production connection pool settings
  max: isProduction ? 20 : 5, // Max connections
  min: isProduction ? 2 : 1,  // Min connections
  idleTimeoutMillis: 30000,    // Close idle connections after 30s
  connectionTimeoutMillis: 10000, // Connection timeout: 10s
  maxUses: 7500, // Max uses per connection before recycling
})

const adapter = new PrismaPg(pool)

// Create Prisma client with configuration
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter,
  log: isDevelopment
    ? [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ]
    : [
        { level: 'error', emit: 'stdout' },
      ],
})

// Log queries in development
if (isDevelopment && typeof logger !== 'undefined') {
  prisma.$on('query' as never, (e: { query: string; params: string; duration: number }) => {
    if (logger) {
      logger.debug(
        {
          query: e.query,
          params: e.params,
          duration: e.duration,
        },
        'Database Query'
      )
    }
  })
}

// Store in global for hot reload in development
if (!isProduction) {
  globalForPrisma.prisma = prisma
  globalForPrisma.pool = pool
}

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Closing database connections...')
  await prisma.$disconnect()
  await pool.end()
  console.log('Database connections closed')
}

// Handle shutdown signals (skip in tests to avoid Jest teardown noise)
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  process.on('SIGINT', gracefulShutdown)
  process.on('SIGTERM', gracefulShutdown)
  process.on('beforeExit', gracefulShutdown)
}

// Health check utility
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean
  latency?: number
  error?: string
}> {
  try {
    const start = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const latency = Date.now() - start

    return {
      healthy: true,
      latency,
    }
  } catch (error) {
    console.error('Database health check failed:', error)
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Connection pool stats
export function getPoolStats() {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  }
}
