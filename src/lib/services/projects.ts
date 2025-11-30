/**
 * Projects Service
 *
 * Сервис для работы с проектами пользователя
 */

import { prisma } from "@/lib/prisma";

/**
 * Получить все проекты пользователя
 */
export async function getUserProjects(userId: string) {
	return await prisma.project.findMany({
		where: {
			userId,
		},
		orderBy: {
			updatedAt: "desc",
		},
		include: {
			_count: {
				select: {
					plans: true,
					messages: true,
					documents: true,
				},
			},
		},
	});
}

/**
 * Создать демо-проект для пользователя
 */
export async function createDemoProjectForUser(userId: string) {
	return await prisma.project.create({
		data: {
			userId,
			title: "Демо-проект",
			type: "apartment",
			area: 65.5,
		},
	});
}

/**
 * Получить проект по ID
 */
export async function getProjectById(projectId: string, userId: string) {
	return await prisma.project.findFirst({
		where: {
			id: projectId,
			userId,
		},
		include: {
			plans: {
				orderBy: {
					version: "desc",
				},
			},
			messages: {
				orderBy: {
					createdAt: "asc",
				},
			},
			documents: true,
		},
	});
}

/**
 * Создать новый проект
 */
export async function createProject(
	userId: string,
	data: {
		title: string;
		type?: string;
		area?: number;
	}
) {
	return await prisma.project.create({
		data: {
			userId,
			title: data.title,
			type: data.type || null,
			area: data.area || null,
		},
	});
}

/**
 * Удалить проект
 */
export async function deleteProject(projectId: string, userId: string) {
	return await prisma.project.delete({
		where: {
			id: projectId,
			userId,
		},
	});
}

/**
 * Удалить все проекты пользователя
 */
export async function deleteAllProjects(userId: string) {
	return await prisma.project.deleteMany({
		where: {
			userId,
		},
	});
}
