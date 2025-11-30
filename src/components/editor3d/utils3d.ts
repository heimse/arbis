/**
 * Утилиты для 3D редактора планировок
 * Функции для работы с 3D геометрией и преобразованиями координат
 */

import type { Vector3 } from "three";
import { Vector3 as THREE_Vector3 } from "three";
import type {
	Node,
	Wall,
	Layer,
	LayerId,
	Door,
	DoorHingeSide,
	DoorSwingDirection,
} from "@/types/editor";

/**
 * Дефолтная высота стены в метрах (для 3D редактора)
 */
export const DEFAULT_WALL_HEIGHT = 2.8;

/**
 * Конвертирует миллиметры в метры
 * @param mm - значение в миллиметрах
 * @returns значение в метрах
 */
export function mmToMeters(mm: number): number {
	return mm / 1000;
}

/**
 * Преобразует узел 2D плана в 3D координаты
 * X координата узла становится X координатой 3D,
 * Y координата узла становится Z координатой 3D,
 * Y координата 3D всегда равна 0 (уровень пола)
 * @param node - узел из 2D плана
 * @returns вектор позиции в 3D пространстве
 */
export function nodeToVector3(node: Node): Vector3 {
	return new THREE_Vector3(node.x, 0, node.y);
}

/**
 * Результат вычисления базовой геометрии стены
 */
export type WallGeometry = {
	/** Длина стены в метрах */
	length: number;
	/** Угол стены в радианах (от положительного направления оси X) */
	angle: number;
	/** Центр стены в 3D пространстве */
	center: Vector3;
	/** Разница по оси X между конечной и начальной точками (в метрах) */
	dx: number;
	/** Разница по оси Z между конечной и начальной точками (в метрах) */
	dz: number;
	/** Высота стены в метрах */
	height: number;
};

/**
 * Вычисляет базовую геометрию стены для рендеринга в 3D
 * @param wall - стена из редактора
 * @param nodes - карта узлов для получения координат начальной и конечной точек
 * @returns геометрия стены (длина, угол, центр, смещения, высота)
 */
export function computeWallGeometry(
	wall: Wall,
	nodes: Map<string, Node>
): WallGeometry {
	const startNode = nodes.get(wall.startNodeId);
	const endNode = nodes.get(wall.endNodeId);

	if (!startNode || !endNode) {
		throw new Error(
			`Wall ${wall.id} references missing nodes: startNodeId=${wall.startNodeId}, endNodeId=${wall.endNodeId}`
		);
	}

	// Преобразуем узлы в 3D координаты
	const start = nodeToVector3(startNode);
	const end = nodeToVector3(endNode);

	// Вычисляем смещения
	const dx = end.x - start.x;
	const dz = end.z - start.z;

	// Вычисляем длину стены
	const length = Math.sqrt(dx * dx + dz * dz);

	// Вычисляем угол в радианах (atan2 учитывает все квадранты)
	const angle = Math.atan2(dz, dx);

	// Вычисляем центр стены
	const center = new THREE_Vector3(
		(start.x + end.x) / 2,
		0,
		(start.z + end.z) / 2
	);

	// Высота стены: используем значение из wall, если задано, иначе дефолтное
	const height = wall.height ?? DEFAULT_WALL_HEIGHT;

	return {
		length,
		angle,
		center,
		dx,
		dz,
		height,
	};
}

/**
 * Проверяет, видим ли слой
 * @param layerId - идентификатор слоя
 * @param layers - карта слоёв
 * @returns true, если слой существует и видим, иначе false
 */
export function isLayerVisible(
	layerId: LayerId,
	layers: Map<LayerId, Layer>
): boolean {
	const layer = layers.get(layerId);
	return layer?.visible ?? false;
}

/**
 * Нормализует дверь: извлекает hingeSide и swingDirection с учётом обратной совместимости
 * @param door - дверь (может иметь старый формат с openDirection)
 * @returns нормализованные значения hingeSide и swingDirection
 */
export function normalizeDoorOrientation(door: Door): {
	hingeSide: DoorHingeSide;
	swingDirection: DoorSwingDirection;
} {
	// Если уже есть новые поля - используем их
	if (door.hingeSide && door.swingDirection) {
		return {
			hingeSide: door.hingeSide,
			swingDirection: door.swingDirection,
		};
	}

	// Миграция со старого формата
	// Если есть openDirection, используем его для hingeSide
	const hingeSide: DoorHingeSide =
		door.hingeSide ?? door.openDirection ?? "right";
	const swingDirection: DoorSwingDirection = door.swingDirection ?? "inside";

	return { hingeSide, swingDirection };
}
