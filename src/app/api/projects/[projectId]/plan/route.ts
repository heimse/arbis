import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Сохранить планировку проекта
 * POST /api/projects/[projectId]/plan
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { projectId } = params
    const { planData, versionName } = await request.json()

    if (!planData || typeof planData !== 'object') {
      return NextResponse.json(
        { error: 'planData is required' },
        { status: 400 }
      )
    }

    // Проверяем, что проект принадлежит пользователю
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
      include: {
        plans: {
          orderBy: {
            version: 'desc',
          },
          take: 1,
        },
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    if (project.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Определяем следующую версию
    const lastVersion = project.plans[0]?.version || 0
    const nextVersion = lastVersion + 1

    // Создаем новую версию планировки
    const planVersion = await prisma.planVersion.create({
      data: {
        projectId,
        version: nextVersion,
        name: versionName || `Версия ${nextVersion}`,
        data: planData,
      },
    })

    return NextResponse.json({
      success: true,
      planVersion: {
        id: planVersion.id,
        version: planVersion.version,
        name: planVersion.name,
        createdAt: planVersion.createdAt,
      },
    })
  } catch (error) {
    console.error('Error saving plan:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

