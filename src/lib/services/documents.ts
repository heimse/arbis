/**
 * Documents Service
 * 
 * Сервис для работы с документами
 */

import { prisma } from '@/lib/prisma'

/**
 * Получить все документы пользователя
 */
export async function getUserDocuments(userId: string) {
  const projects = await prisma.project.findMany({
    where: {
      userId,
    },
    include: {
      documents: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  })

  // Преобразуем в плоский список документов с информацией о проекте
  const documents = projects.flatMap(project =>
    project.documents.map(doc => ({
      ...doc,
      project: {
        id: project.id,
        title: project.title,
        type: project.type,
      },
    }))
  )

  return documents.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

/**
 * Получить документы проекта
 */
export async function getProjectDocuments(projectId: string, userId: string) {
  return await prisma.document.findMany({
    where: {
      projectId,
      project: {
        userId,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

/**
 * Получить документы по типу
 */
export async function getDocumentsByType(
  userId: string,
  type: string
) {
  return await prisma.document.findMany({
    where: {
      project: {
        userId,
      },
      type,
    },
    include: {
      project: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

/**
 * Создать новый документ
 */
export async function createDocument(
  projectId: string,
  userId: string,
  data: {
    type: string
    fileUrl: string
    meta?: any
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

  return await prisma.document.create({
    data: {
      projectId,
      type: data.type,
      fileUrl: data.fileUrl,
      meta: data.meta || null,
    },
  })
}



