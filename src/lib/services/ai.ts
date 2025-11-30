/**
 * AI Service
 *
 * Сервис для интеграции с Yandex Cloud REST Assistant API
 */

import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import type { PlanData } from "@/types/plan";
import {
	calculateTotalArea,
	getRoomAreas,
	getAreaByRoomType,
} from "@/lib/utils/plan-calculations";

/**
 * Получить ответ от AI-ассистента
 *
 * @param projectId - ID проекта
 * @param userMessage - Сообщение пользователя
 * @returns Ответ AI-ассистента
 */
export async function getAIResponse(
	projectId: string,
	userMessage: string
): Promise<string> {
	// Извлекаем JSON проекта из сообщения, если он есть
	let projectJSON: any = null;
	const jsonMatch = userMessage.match(
		/Контекст проекта \(JSON\):\s*(\{[\s\S]*\})/
	);
	if (jsonMatch) {
		try {
			projectJSON = JSON.parse(jsonMatch[1]);
		} catch (error) {
			console.warn("Не удалось распарсить JSON проекта из сообщения");
		}
	}

	// Проверяем, есть ли запрос о площади
	const lowerMessage = userMessage.toLowerCase();
	const isAreaQuery =
		lowerMessage.includes("площад") ||
		(lowerMessage.includes("посчитай") && lowerMessage.includes("площад")) ||
		(lowerMessage.includes("рассчитай") && lowerMessage.includes("площад")) ||
		(lowerMessage.includes("сколько") && lowerMessage.includes("площад")) ||
		(lowerMessage.includes("размер") && lowerMessage.includes("площад"));

	// Проверяем, есть ли запрос о смете
	const isEstimateQuery =
		lowerMessage.includes("смет") ||
		lowerMessage.includes("стоимость") ||
		lowerMessage.includes("цена") ||
		lowerMessage.includes("материал") ||
		(lowerMessage.includes("посчитай") &&
			(lowerMessage.includes("материал") ||
				lowerMessage.includes("стоимость"))) ||
		(lowerMessage.includes("рассчитай") &&
			(lowerMessage.includes("материал") ||
				lowerMessage.includes("стоимость")));

	// Обработка запроса о смете материалов
	if (isEstimateQuery && projectJSON) {
		try {
			const estimate = calculateMaterialEstimate(projectJSON);
			return formatEstimateResponse(estimate);
		} catch (error) {
			console.error("Error calculating estimate:", error);
			// Продолжаем выполнение, чтобы AI мог ответить
		}
	}

	if (isAreaQuery) {
		// Используем JSON из сообщения, если он есть, иначе получаем из БД
		let planData: PlanData | null = null;

		if (projectJSON) {
			planData = projectJSON as PlanData;
		} else {
			// Получаем последнюю планировку проекта
			const latestPlan = await getLatestPlan(projectId);
			if (latestPlan && latestPlan.data) {
				planData = latestPlan.data as PlanData;
			}
		}

		if (!planData) {
			return "В проекте пока нет планировки. Создайте планировку в редакторе, чтобы я мог рассчитать площадь.";
		}

		try {
			const totalArea = calculateTotalArea(planData);
			const roomAreas = getRoomAreas(planData);
			const areasByType = getAreaByRoomType(planData);

			if (totalArea === 0) {
				return "В планировке пока нет комнат. Добавьте комнаты в редакторе, чтобы рассчитать площадь.";
			}

			// Формируем детальный ответ
			let response = `Исходя из планировки, общая площадь квартиры составляет **${totalArea} м²**.\n\n`;

			if (roomAreas.length > 0) {
				response += "**Площади комнат:**\n";
				roomAreas.forEach((room) => {
					const roomTypeNames: Record<string, string> = {
						bedroom: "Спальня",
						"living-room": "Гостиная",
						kitchen: "Кухня",
						bathroom: "Санузел",
						toilet: "Туалет",
						corridor: "Коридор",
						hallway: "Прихожая",
						balcony: "Балкон",
						loggia: "Лоджия",
						storage: "Кладовая",
						technical: "Тех. помещение",
						other: "Другое",
					};

					const typeName = roomTypeNames[room.type] || room.type;
					response += `• ${room.name}: ${room.area} м² (${typeName})\n`;
				});
			}

			// Добавляем информацию о площадях по типам, если есть несколько комнат одного типа
			const multipleTypes = Object.keys(areasByType).filter(
				(type) => roomAreas.filter((r) => r.type === type).length > 1
			);

			if (multipleTypes.length > 0) {
				response += "\n**Суммарные площади по типам:**\n";
				multipleTypes.forEach((type) => {
					const typeNames: Record<string, string> = {
						bedroom: "Спальни",
						"living-room": "Гостиные",
						kitchen: "Кухни",
						bathroom: "Санузлы",
						toilet: "Туалеты",
						corridor: "Коридоры",
						hallway: "Прихожие",
						balcony: "Балконы",
						loggia: "Лоджии",
						storage: "Кладовые",
						technical: "Тех. помещения",
						other: "Другое",
					};

					const typeName = typeNames[type] || type;
					response += `• ${typeName}: ${areasByType[type]} м²\n`;
				});
			}

			return response;
		} catch (error) {
			console.error("Error calculating area:", error);
			return "Произошла ошибка при расчете площади. Убедитесь, что планировка корректна.";
		}
	}

	// Интеграция с Yandex Cloud REST Assistant API
	try {
		const apiKey = process.env.YANDEX_CLOUD_API_KEY;
		const yandexProjectId =
			process.env.YANDEX_CLOUD_PROJECT_ID || "b1gqkhrllleglkvashd3";
		const agentId = process.env.YANDEX_CLOUD_AGENT_ID || "fvtj2snqf0ane0lg8rqf";

		if (!apiKey) {
			console.warn("YANDEX_CLOUD_API_KEY не установлен, используется заглушка");
			return getFallbackResponse();
		}

		// Получаем контекст проекта для передачи в AI (используем projectId из параметра функции)
		const projectContext = await getProjectContext(projectId);
		const latestPlan = await getLatestPlan(projectId);

		// Формируем контекстное сообщение с информацией о проекте
		// Если JSON уже есть в сообщении, используем его, иначе добавляем краткую информацию
		let contextualMessage = userMessage;

		// Если JSON проекта уже в сообщении, не добавляем его повторно
		if (!projectJSON) {
			const latestPlan = await getLatestPlan(projectId);
			if (latestPlan && latestPlan.data) {
				try {
					const planData = latestPlan.data as PlanData;
					const totalArea = calculateTotalArea(planData);
					if (totalArea > 0) {
						contextualMessage = `Контекст проекта: общая площадь ${totalArea} м². ${userMessage}`;
					}
				} catch (error) {
					// Игнорируем ошибки при расчете площади для контекста
				}
			}
		}

		// Создаем клиент OpenAI для работы с Yandex Cloud API
		const client = new OpenAI({
			apiKey: apiKey,
			baseURL: "https://rest-assistant.api.cloud.yandex.net/v1",
		});

		// Вызов Yandex Cloud REST Assistant API через OpenAI SDK
		// Передаем project в body запроса, как требует Yandex Cloud API
		const response = await client.responses.create({
			prompt: {
				id: agentId,
			},
			input: contextualMessage,
			project: yandexProjectId,
		} as any);

		// Извлекаем текст ответа
		if (response.output_text) {
			return response.output_text;
		}

		// Если структура ответа отличается, пытаемся найти текст в других полях
		if ((response as any).output?.text) {
			return (response as any).output.text;
		}

		if ((response as any).text) {
			return (response as any).text;
		}

		console.warn("Неожиданная структура ответа от Yandex Cloud API:", response);
		return getFallbackResponse();
	} catch (error) {
		console.error("Error calling Yandex Cloud API:", error);
		return getFallbackResponse();
	}
}

/**
 * Получить заглушку ответа при ошибке или отсутствии API ключа
 */
function getFallbackResponse(): string {
	const responses = [
		"Понял ваш запрос. Давайте обсудим планировку подробнее.",
		"Хороший вопрос! Для планировки важно учитывать несколько факторов.",
		"Я могу помочь вам с планировкой. Что именно вас интересует?",
		"Отличная идея! Давайте рассмотрим варианты реализации.",
		"Понял. Для вашей планировки рекомендую следующее:",
	];
	return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Получить последнюю планировку проекта
 */
async function getLatestPlan(projectId: string) {
	return await prisma.planVersion.findFirst({
		where: {
			projectId,
		},
		orderBy: {
			version: "desc",
		},
	});
}

/**
 * Получить контекст проекта для AI
 *
 * @param projectId - ID проекта
 * @returns Контекст проекта (планы, параметры и т.д.)
 */
export async function getProjectContext(projectId: string) {
	try {
		const project = await prisma.project.findUnique({
			where: { id: projectId },
			include: {
				planVersions: {
					orderBy: { version: "desc" },
					take: 1,
				},
			},
		});

		if (!project) {
			return { projectId };
		}

		const context: {
			projectId: string;
			projectTitle?: string;
			hasPlan?: boolean;
			totalArea?: number;
		} = {
			projectId,
			projectTitle: project.title,
			hasPlan: project.planVersions.length > 0,
		};

		// Добавляем информацию о площади, если есть план
		if (project.planVersions.length > 0 && project.planVersions[0].data) {
			try {
				const planData = project.planVersions[0].data as PlanData;
				const totalArea = calculateTotalArea(planData);
				if (totalArea > 0) {
					context.totalArea = totalArea;
				}
			} catch (error) {
				// Игнорируем ошибки при расчете площади
			}
		}

		return context;
	} catch (error) {
		console.error("Error getting project context:", error);
		return { projectId };
	}
}

/**
 * Рассчитать смету материалов на основе JSON проекта
 */
function calculateMaterialEstimate(projectJSON: any): {
	walls: { area: number; volume: number; materials: string[] };
	floors: { area: number; materials: string[] };
	doors: { count: number; totalArea: number };
	windows: { count: number; totalArea: number };
	furniture: { count: number };
} {
	const estimate = {
		walls: { area: 0, volume: 0, materials: [] as string[] },
		floors: { area: 0, materials: [] as string[] },
		doors: { count: 0, totalArea: 0 },
		windows: { count: 0, totalArea: 0 },
		furniture: { count: 0 },
	};

	// Расчет стен
	if (Array.isArray(projectJSON.walls)) {
		projectJSON.walls.forEach((wall: any) => {
			if (wall.startNodeId && wall.endNodeId && projectJSON.nodes) {
				const startNode = projectJSON.nodes.find(
					(n: any) => n.id === wall.startNodeId
				);
				const endNode = projectJSON.nodes.find(
					(n: any) => n.id === wall.endNodeId
				);

				if (startNode && endNode) {
					const length = Math.sqrt(
						Math.pow(endNode.x - startNode.x, 2) +
							Math.pow(endNode.y - startNode.y, 2)
					);
					const height = wall.height || 2.7; // м
					const thickness = (wall.thickness || 200) / 1000; // мм в м

					const area = length * height;
					const volume = area * thickness;

					estimate.walls.area += area;
					estimate.walls.volume += volume;

					if (wall.type) {
						estimate.walls.materials.push(
							wall.type === "load-bearing" ? "Несущая стена" : "Перегородка"
						);
					}
				}
			}
		});
	}

	// Расчет полов (комнаты)
	if (Array.isArray(projectJSON.rooms)) {
		projectJSON.rooms.forEach((room: any) => {
			if (room.size) {
				const area = room.size.width * room.size.height;
				estimate.floors.area += area;

				if (room.floorFillMode === "texture" && room.floorTexture) {
					estimate.floors.materials.push("Напольное покрытие (текстура)");
				} else if (room.floorColor) {
					estimate.floors.materials.push("Напольное покрытие");
				}
			}
		});
	}

	// Подсчет дверей
	if (Array.isArray(projectJSON.doors)) {
		estimate.doors.count = projectJSON.doors.length;
		projectJSON.doors.forEach((door: any) => {
			const area =
				((door.width || 900) / 1000) * ((door.height || 2100) / 1000); // мм в м²
			estimate.doors.totalArea += area;
		});
	}

	// Подсчет окон
	if (Array.isArray(projectJSON.windows)) {
		estimate.windows.count = projectJSON.windows.length;
		projectJSON.windows.forEach((window: any) => {
			const area =
				((window.width || 1200) / 1000) * ((window.height || 1400) / 1000); // мм в м²
			estimate.windows.totalArea += area;
		});
	}

	// Подсчет мебели
	if (Array.isArray(projectJSON.furniture)) {
		estimate.furniture.count = projectJSON.furniture.length;
	}

	return estimate;
}

/**
 * Форматировать ответ со сметой
 */
function formatEstimateResponse(
	estimate: ReturnType<typeof calculateMaterialEstimate>
): string {
	let response = "## Смета материалов проекта\n\n";

	// Стены
	response += "### Стены\n";
	response += `- Площадь стен: ${estimate.walls.area.toFixed(2)} м²\n`;
	response += `- Объем стен: ${estimate.walls.volume.toFixed(2)} м³\n`;
	if (estimate.walls.materials.length > 0) {
		const uniqueMaterials = [...new Set(estimate.walls.materials)];
		response += `- Типы: ${uniqueMaterials.join(", ")}\n`;
	}
	response += "\n";

	// Полы
	response += "### Полы\n";
	response += `- Площадь полов: ${estimate.floors.area.toFixed(2)} м²\n`;
	if (estimate.floors.materials.length > 0) {
		response += `- Требуется напольное покрытие\n`;
	}
	response += "\n";

	// Двери
	response += "### Двери\n";
	response += `- Количество: ${estimate.doors.count} шт.\n`;
	response += `- Общая площадь: ${estimate.doors.totalArea.toFixed(2)} м²\n`;
	response += "\n";

	// Окна
	response += "### Окна\n";
	response += `- Количество: ${estimate.windows.count} шт.\n`;
	response += `- Общая площадь: ${estimate.windows.totalArea.toFixed(2)} м²\n`;
	response += "\n";

	// Мебель
	response += "### Мебель\n";
	response += `- Количество предметов: ${estimate.furniture.count} шт.\n`;
	response += "\n";

	response += "---\n";
	response +=
		"*Для точной стоимости материалов рекомендую обратиться в строительные магазины или использовать онлайн-калькуляторы.*\n";
	response += "\nПолезные ссылки:\n";
	response += "- https://leroymerlin.ru - Леруа Мерлен\n";
	response += "- https://petrovich.ru - Петрович\n";
	response += "- https://stroylandiya.ru - Стройландия\n";

	return response;
}
