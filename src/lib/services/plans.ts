/**
 * Plans Service
 * 
 * Сервис для работы с вариантами планировок
 */

import { prisma } from '@/lib/prisma'

/**
 * Получить все варианты планировок пользователя
 */
export async function getUserPlans(userId: string) {
  const projects = await prisma.project.findMany({
    where: {
      userId,
    },
    include: {
      plans: {
        orderBy: {
          createdAt: 'desc',
        },
      },
      _count: {
        select: {
          plans: true,
        },
      },
    },
  })

  // Преобразуем в плоский список планов с информацией о проекте
  const plans = projects.flatMap(project =>
    project.plans.map(plan => ({
      ...plan,
      project: {
        id: project.id,
        title: project.title,
        type: project.type,
        area: project.area,
      },
    }))
  )

  return plans.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

/**
 * Получить план по ID
 */
export async function getPlanById(planId: string, userId: string) {
  const plan = await prisma.planVersion.findFirst({
    where: {
      id: planId,
      project: {
        userId,
      },
    },
    include: {
      project: true,
    },
  })

  return plan
}

/**
 * Получить планы проекта
 */
export async function getProjectPlans(projectId: string, userId: string) {
  return await prisma.planVersion.findMany({
    where: {
      projectId,
      project: {
        userId,
      },
    },
    orderBy: {
      version: 'desc',
    },
  })
}

