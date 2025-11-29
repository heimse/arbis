/**
 * Messages Service
 * 
 * Сервис для работы с сообщениями чата
 */

import { prisma } from '@/lib/prisma'

/**
 * Получить все сообщения пользователя (из всех проектов)
 */
export async function getUserMessages(userId: string) {
  const projects = await prisma.project.findMany({
    where: {
      userId,
    },
    include: {
      messages: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 10, // Последние 10 сообщений из каждого проекта
      },
    },
  })

  // Преобразуем в плоский список сообщений с информацией о проекте
  const messages = projects.flatMap(project =>
    project.messages.map(message => ({
      ...message,
      project: {
        id: project.id,
        title: project.title,
      },
    }))
  )

  return messages.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

/**
 * Получить сообщения проекта
 */
export async function getProjectMessages(projectId: string, userId: string) {
  return await prisma.chatMessage.findMany({
    where: {
      projectId,
      project: {
        userId,
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  })
}

/**
 * Создать новое сообщение
 */
export async function createMessage(
  projectId: string,
  userId: string,
  data: {
    role: 'user' | 'assistant' | 'system'
    content: string
    attachments?: any
  }
) {
  // Проверяем, что проект принадлежит пользователю
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
  })

  if (!project) {
    throw new Error('Project not found or access denied')
  }

  return await prisma.chatMessage.create({
    data: {
      projectId,
      role: data.role,
      content: data.content,
      attachments: data.attachments || null,
    },
  })
}

