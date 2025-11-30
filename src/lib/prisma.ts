/**
 * Prisma Client Singleton
 * 
 * В dev-режиме Next.js перезагружает модули при hot-reload,
 * что может создавать множество экземпляров PrismaClient.
 * Этот паттерн предотвращает такое поведение.
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}



