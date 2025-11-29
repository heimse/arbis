/**
 * AI Service
 * 
 * Сервис для интеграции с нейросетью
 * В будущем здесь будет интеграция с реальным AI API
 */

import { prisma } from "@/lib/prisma";
import type { PlanData } from "@/types/plan";
import { calculateTotalArea, getRoomAreas, getAreaByRoomType } from "@/lib/utils/plan-calculations";

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
	// Проверяем, есть ли запрос о площади
	const lowerMessage = userMessage.toLowerCase();
	const isAreaQuery = 
		lowerMessage.includes("площад") ||
		lowerMessage.includes("посчитай") ||
		lowerMessage.includes("рассчитай") ||
		lowerMessage.includes("сколько") ||
		lowerMessage.includes("размер");

	if (isAreaQuery) {
		// Получаем последнюю планировку проекта
		const latestPlan = await getLatestPlan(projectId);
		
		if (!latestPlan || !latestPlan.data) {
			return "В проекте пока нет сохраненных планировок. Создайте планировку в редакторе, чтобы я мог рассчитать площадь.";
		}

		try {
			const planData = latestPlan.data as PlanData;
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

	// TODO: Интеграция с реальным AI API для других запросов
	// Пример: OpenAI, Anthropic, или другой провайдер
	
	// Временная заглушка для демонстрации
	// В будущем здесь будет вызов реального API
	
	// Симуляция задержки API
	await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

	// Временные ответы для демонстрации
	const responses = [
		"Понял ваш запрос. Давайте обсудим планировку подробнее.",
		"Хороший вопрос! Для планировки важно учитывать несколько факторов.",
		"Я могу помочь вам с планировкой. Что именно вас интересует?",
		"Отличная идея! Давайте рассмотрим варианты реализации.",
		"Понял. Для вашей планировки рекомендую следующее:",
	];

	const randomResponse = responses[Math.floor(Math.random() * responses.length)];

	// В будущем здесь будет:
	// 1. Вызов API нейросети (OpenAI, Anthropic и т.д.)
	// 2. Передача контекста проекта
	// 3. Обработка ответа
	// 4. Возврат сгенерированного текста

	return randomResponse;
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
	// TODO: Получение контекста проекта для передачи в AI
	// Это может включать:
	// - Текущие планы планировки
	// - Параметры проекта (площадь, тип и т.д.)
	// - История сообщений
	// - Загруженные документы
	
	return {
		projectId,
		// Дополнительный контекст
	};
}

