/**
 * Дополнительные типы для Prisma
 */

import { Project, User } from '@prisma/client'

export type ProjectWithCounts = Project & {
  _count: {
    plans: number
    messages: number
    documents: number
  }
}

export type { Project, User }



