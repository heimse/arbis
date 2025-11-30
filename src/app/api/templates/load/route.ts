import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

/**
 * Загрузить шаблоны планировок в проекты пользователя
 * POST /api/templates/load
 */
export async function POST(request: NextRequest) {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userId = session.user.id;
		const plansDir = path.join(process.cwd(), "public", "plans");

		// Список файлов планировок
		const planFiles = [
			{
				file: "plan-1-bedroom.json",
				title: "Однокомнатная квартира",
				type: "apartment",
				area: 24,
			},
			{
				file: "plan-2-bedroom.json",
				title: "Двухкомнатная квартира",
				type: "apartment",
				area: 40,
			},
			{
				file: "plan-3-bedroom.json",
				title: "Трехкомнатная квартира",
				type: "apartment",
				area: 60,
			},
			{
				file: "plan-studio.json",
				title: "Студия",
				type: "apartment",
				area: 20,
			},
			{
				file: "plan-with-balcony.json",
				title: "Квартира с балконом",
				type: "apartment",
				area: 35,
			},
			{
				file: "plan-kitchen-living.json",
				title: "Квартира с кухней",
				type: "apartment",
				area: 50,
			},
		];

		const createdProjects: Array<{
			projectId: string;
			title: string;
			action: "created" | "updated";
		}> = [];

		for (const planInfo of planFiles) {
			const filePath = path.join(plansDir, planInfo.file);

			// Проверяем, существует ли файл
			if (!fs.existsSync(filePath)) {
				console.warn(`File not found: ${filePath}`);
				continue;
			}

			// Читаем JSON файл
			const fileContent = fs.readFileSync(filePath, "utf-8");
			const planData = JSON.parse(fileContent);

			// Сохраняем данные в формате editorStore (как в useAutoSave)
			// Данные уже в правильном формате - массивы вместо Map
			const convertedPlanData = {
				nodes: planData.nodes || [],
				walls: planData.walls || [],
				doors: planData.doors || [],
				windows: planData.windows || [],
				rooms: planData.rooms || [],
				furniture: planData.furniture || [],
				dimensions: planData.dimensions || [],
				layers: planData.layers || [],
				camera: planData.camera || { x: 0, y: 0, zoom: 50 },
				backgroundImage: planData.backgroundImage || null,
				gridSettings: planData.gridSettings || {
					visible: true,
					spacing: 0.5,
					subdivisions: 5,
					color: "#e5e7eb",
					majorColor: "#d1d5db",
				},
				planSettings: planData.planSettings || {
					width: 20,
					height: 20,
					units: "meters",
					scale: 50,
				},
				snapMode: planData.snapMode || {
					toGrid: true,
					toNodes: true,
					toWallMidpoints: true,
					toOrthogonal: true,
				},
			};

			// Проверяем, не существует ли уже проект с таким названием
			const existingProject = await prisma.project.findFirst({
				where: {
					userId,
					title: planInfo.title,
				},
			});

			if (existingProject) {
				// Если проект существует, обновляем его план
				const lastVersion = await prisma.planVersion.findFirst({
					where: { projectId: existingProject.id },
					orderBy: { version: "desc" },
				});

				const nextVersion = (lastVersion?.version || 0) + 1;

				await prisma.planVersion.create({
					data: {
						projectId: existingProject.id,
						version: nextVersion,
						name: `Версия ${nextVersion}`,
						data: convertedPlanData as any,
					},
				});

				createdProjects.push({
					projectId: existingProject.id,
					title: planInfo.title,
					action: "updated",
				});
			} else {
				// Создаем новый проект
				const project = await prisma.project.create({
					data: {
						userId,
						title: planInfo.title,
						type: planInfo.type,
						area: planInfo.area,
					},
				});

				// Создаем первую версию планировки
				await prisma.planVersion.create({
					data: {
						projectId: project.id,
						version: 1,
						name: "Версия 1",
						data: convertedPlanData as any,
					},
				});

				createdProjects.push({
					projectId: project.id,
					title: planInfo.title,
					action: "created",
				});
			}
		}

		return NextResponse.json({
			success: true,
			message: `Загружено ${createdProjects.length} планировок`,
			projects: createdProjects,
		});
	} catch (error) {
		console.error("Error loading templates:", error);
		return NextResponse.json(
			{
				error: "Internal server error",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
