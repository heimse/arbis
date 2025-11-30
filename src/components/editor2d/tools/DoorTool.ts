// Инструмент для добавления дверей

import type { Point, EditorState, Wall, Node } from "@/types/editor";
import { closestPointOnSegment } from "@/lib/editor/geometry";
import { generateDoorId, DEFAULT_DOOR_SIZE } from "@/lib/editor/utils";

export class DoorTool {
	/**
	 * Обработка клика для добавления двери на стену
	 */
	static handleClick(
		position: Point,
		state: EditorState,
		dispatch: any
	): boolean {
		const { walls, nodes } = state;

		// Ищем стену, на которую кликнули
		const result = this.findWallAtPoint(position, walls, nodes);

		if (!result) {
			return false;
		}

		const { wall, t } = result;

		// Создаём дверь
		const doorId = generateDoorId();
		dispatch({
			type: "ADD_DOOR",
			door: {
				id: doorId,
				wallId: wall.id,
				position: t, // позиция вдоль стены от 0 до 1
				width: DEFAULT_DOOR_SIZE.width,
				height: DEFAULT_DOOR_SIZE.height,
				hingeSide: "right", // дефолт: петли справа
				swingDirection: "inside", // дефолт: открывается внутрь
				layerId: "layer-openings",
			},
		});

		// Выделяем добавленную дверь
		dispatch({
			type: "SET_SELECTION",
			selection: { type: "door", id: doorId },
		});

		return true;
	}

	/**
	 * Находит стену в точке клика
	 */
	private static findWallAtPoint(
		point: Point,
		walls: Map<string, Wall>,
		nodes: Map<string, Node>
	): { wall: Wall; t: number } | null {
		const threshold = 0.2; // 20 см

		for (const wall of walls.values()) {
			const startNode = nodes.get(wall.startNodeId);
			const endNode = nodes.get(wall.endNodeId);

			if (!startNode || !endNode) continue;

			const result = closestPointOnSegment(point, startNode, endNode);

			const dx = result.point.x - point.x;
			const dy = result.point.y - point.y;
			const distance = Math.sqrt(dx * dx + dy * dy);

			if (distance <= threshold) {
				return { wall, t: result.t };
			}
		}

		return null;
	}
}
