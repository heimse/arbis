/**
 * History Service
 * 
 * Сервис для работы с историей действий пользователя
 */

import { prisma } from '@/lib/prisma'

/**
 * Получить историю действий пользователя
 * Объединяет историю из всех проектов: создание планов, сообщения, документы
 */
export async function getUserHistory(userId: string) {
  const [projects, messages, documents, plans] = await Promise.all([
    prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.chatMessage.findMany({
      where: {
        project: { userId },
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.document.findMany({
      where: {
        project: { userId },
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.planVersion.findMany({
      where: {
        project: { userId },
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

  // Объединяем все события в один массив
  const history: Array<{
    id: string
    type: 'project' | 'message' | 'document' | 'plan'
    action: string
    description: string
    projectId?: string
    projectTitle?: string
    createdAt: Date
  }> = []

  // Проекты
  projects.forEach(project => {
    history.push({
      id: project.id,
      type: 'project',
      action: 'Создан проект',
      description: `Проект "${project.title}"`,
      projectId: project.id,
      projectTitle: project.title,
      createdAt: project.createdAt,
    })
  })

  // Сообщения
  messages.forEach(message => {
    history.push({
      id: message.id,
      type: 'message',
      action: message.role === 'user' ? 'Отправлено сообщение' : 'Получен ответ',
      description: message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''),
      projectId: message.projectId,
      projectTitle: message.project.title,
      createdAt: message.createdAt,
    })
  })

  // Документы
  documents.forEach(doc => {
    const typeNames: Record<string, string> = {
      bti_plan: 'План БТИ',
      walls_drawings: 'Чертежи стен',
      general_plan: 'Генплан',
      norms_list: 'Список норм',
      materials: 'Материалы',
      approval_package: 'Пакет согласования',
    }
    history.push({
      id: doc.id,
      type: 'document',
      action: 'Загружен документ',
      description: `${typeNames[doc.type] || doc.type} в проекте "${doc.project.title}"`,
      projectId: doc.projectId,
      projectTitle: doc.project.title,
      createdAt: doc.createdAt,
    })
  })

  // Планы
  plans.forEach(plan => {
    history.push({
      id: plan.id,
      type: 'plan',
      action: 'Создан вариант планировки',
      description: `Вариант "${plan.name}" (версия ${plan.version}) в проекте "${plan.project.title}"`,
      projectId: plan.projectId,
      projectTitle: plan.project.title,
      createdAt: plan.createdAt,
    })
  })

  // Сортируем по дате (новые первыми)
  return history.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

