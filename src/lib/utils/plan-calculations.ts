/**
 * Утилиты для расчетов на основе планировки
 */

import type { PlanData, Room } from "@/types/plan";

/**
 * Рассчитать общую площадь квартиры из планировки
 * Суммирует площади всех комнат
 */
export function calculateTotalArea(planData: PlanData): number {
	if (!planData.rooms || planData.rooms.length === 0) {
		return 0;
	}

	// Суммируем площади всех комнат
	const totalArea = planData.rooms.reduce((sum, room) => {
		// Если площадь уже рассчитана, используем её
		if (room.area && room.area > 0) {
			return sum + room.area;
		}
		
		// Если площадь не рассчитана, но есть полигон, вычисляем площадь
		if (room.polygon && room.polygon.length >= 3) {
			const calculatedArea = calculatePolygonArea(room.polygon, planData.realWorldSize);
			return sum + calculatedArea;
		}
		
		return sum;
	}, 0);

	return Math.round(totalArea * 100) / 100; // Округляем до 2 знаков после запятой
}

/**
 * Рассчитать площадь многоугольника
 * Использует формулу площади Гаусса (Shoelace formula)
 */
function calculatePolygonArea(polygon: Array<{ x: number; y: number }>, realWorldSize?: { pixelsPerMeter: number }): number {
	if (polygon.length < 3) {
		return 0;
	}

	// Вычисляем площадь в пикселях
	let area = 0;
	for (let i = 0; i < polygon.length; i++) {
		const j = (i + 1) % polygon.length;
		area += polygon[i].x * polygon[j].y;
		area -= polygon[j].x * polygon[i].y;
	}
	area = Math.abs(area) / 2;

	// Конвертируем из пикселей в квадратные метры
	// Если есть realWorldSize, используем его, иначе предполагаем стандартный масштаб
	const pixelsPerMeter = realWorldSize?.pixelsPerMeter || 80; // 80 пикселей на метр по умолчанию
	const areaInSquareMeters = area / (pixelsPerMeter * pixelsPerMeter);

	return areaInSquareMeters;
}

/**
 * Получить детальную информацию о площадях комнат
 */
export function getRoomAreas(planData: PlanData): Array<{ name: string; area: number; type: string }> {
	if (!planData.rooms || planData.rooms.length === 0) {
		return [];
	}

	return planData.rooms.map((room) => {
		let area = room.area;
		
		// Если площадь не рассчитана, вычисляем из полигона
		if (!area || area === 0) {
			area = calculatePolygonArea(room.polygon, planData.realWorldSize);
		}

		return {
			name: room.name || "Без названия",
			area: Math.round(area * 100) / 100,
			type: room.roomType || "other",
		};
	});
}

/**
 * Получить площадь по типам комнат
 */
export function getAreaByRoomType(planData: PlanData): Record<string, number> {
	const roomAreas = getRoomAreas(planData);
	const areasByType: Record<string, number> = {};

	roomAreas.forEach(({ type, area }) => {
		if (!areasByType[type]) {
			areasByType[type] = 0;
		}
		areasByType[type] += area;
	});

	// Округляем значения
	Object.keys(areasByType).forEach((key) => {
		areasByType[key] = Math.round(areasByType[key] * 100) / 100;
	});

	return areasByType;
}



