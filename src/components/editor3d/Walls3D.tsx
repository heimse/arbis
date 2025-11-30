import React, { useMemo } from "react";
import { Wall, Node, Door, Window } from "@/types/editor";
import * as THREE from "three";

interface Walls3DProps {
	walls: Wall[];
	nodes: Map<string, Node>;
	doors: Door[];
	windows: Window[];
}

const DEFAULT_WALL_HEIGHT = 2.8; // метры

/**
 * Компонент для отрисовки стен в 3D
 */
export function Walls3D({ walls, nodes, doors, windows }: Walls3DProps) {
	return (
		<>
			{walls.map((wall) => (
				<Wall3D
					key={wall.id}
					wall={wall}
					nodes={nodes}
					doors={doors.filter((d) => d.wallId === wall.id)}
					windows={windows.filter((w) => w.wallId === wall.id)}
				/>
			))}
		</>
	);
}

interface Wall3DProps {
	wall: Wall;
	nodes: Map<string, Node>;
	doors: Door[];
	windows: Window[];
}

function Wall3D({ wall, nodes, doors, windows }: Wall3DProps) {
	const startNode = nodes.get(wall.startNodeId);
	const endNode = nodes.get(wall.endNodeId);

	// Геометрия стены
	const wallGeometry = useMemo(() => {
		if (!startNode || !endNode) return null;

		const dx = endNode.x - startNode.x;
		const dz = endNode.y - startNode.y; // node.y -> Z в 3D
		const length = Math.sqrt(dx * dx + dz * dz);
		const angle = Math.atan2(dz, dx);

		const thickness = wall.thickness / 1000; // мм -> метры
		const height = wall.height || DEFAULT_WALL_HEIGHT;

		// Центр стены
		const centerX = (startNode.x + endNode.x) / 2;
		const centerZ = (startNode.y + endNode.y) / 2;

		// Определяем, нужно ли переворачивать позицию проёмов вдоль стены
		// Если стена идёт влево в глобальных координатах - считаем её перевёрнутой
		// Для вертикальных стен (dx ≈ 0) НИКОГДА не переворачиваем
		const isVertical = Math.abs(dx) < 1e-6;
		const flipAlongLength = isVertical ? false : dx < 0;

		return {
			position: [centerX, height / 2, centerZ] as [number, number, number],
			rotation: [0, angle, 0] as [number, number, number],
			size: [length, height, thickness] as [number, number, number],
			flipAlongLength,
		};
	}, [startNode, endNode, wall.thickness, wall.height]);

	// Цвет и материал стены в зависимости от типа
	const wallMaterial = useMemo(() => {
		switch (wall.type) {
			case "load-bearing":
				return {
					color: "#374151", // более тёмный серый для несущих стен
					roughness: 0.9, // матовый, без блеска
					metalness: 0.0,
				};
			case "partition":
				return {
					color: "#9ca3af", // светлее для перегородок
					roughness: 0.85,
					metalness: 0.0,
				};
			default:
				return {
					color: "#6b7280",
					roughness: 0.9,
					metalness: 0.0,
				};
		}
	}, [wall.type]);

	if (!wallGeometry || !startNode || !endNode) return null;

	// Создаем геометрию с проёмами
	const hasOpenings = doors.length > 0 || windows.length > 0;

	if (!hasOpenings) {
		// Простая стена без проёмов
		return (
			<mesh
				position={wallGeometry.position}
				rotation={wallGeometry.rotation}
				castShadow
				receiveShadow
				userData={{ objectId: wall.id, objectType: "wall" }}
			>
				<boxGeometry args={wallGeometry.size} />
				<meshStandardMaterial
					color={wallMaterial.color}
					roughness={wallMaterial.roughness}
					metalness={wallMaterial.metalness}
				/>
			</mesh>
		);
	}

	// Стена с проёмами - разбиваем на сегменты
	return (
		<group
			position={wallGeometry.position}
			rotation={wallGeometry.rotation}
			userData={{ objectId: wall.id, objectType: "wall" }}
		>
			<WallWithOpenings
				length={wallGeometry.size[0]}
				height={wallGeometry.size[1]}
				thickness={wallGeometry.size[2]}
				material={wallMaterial}
				doors={doors}
				windows={windows}
				flipAlongLength={wallGeometry.flipAlongLength}
			/>
		</group>
	);
}

interface WallWithOpeningsProps {
	length: number;
	height: number;
	thickness: number;
	material: {
		color: string;
		roughness: number;
		metalness: number;
	};
	doors: Door[];
	windows: Window[];
	flipAlongLength?: boolean;
}

function WallWithOpenings({
	length,
	height,
	thickness,
	material,
	doors,
	windows,
	flipAlongLength = false,
}: WallWithOpeningsProps) {
	// Создаем массив проёмов с их позициями
	const openings = useMemo(() => {
		const result: Array<{
			start: number;
			end: number;
			bottom: number;
			top: number;
			type: "door" | "window";
		}> = [];

		doors.forEach((door) => {
			const doorWidth = door.width / 1000; // мм -> метры
			const doorHeight = door.height / 1000;
			// door.position от 0 до 1 - позиция от "начала" стены
			// Если стена перевёрнута (flipAlongLength), то интерпретируем
			// позицию от противоположного края: 1 - position
			const pos01 = flipAlongLength ? 1 - door.position : door.position;
			// Преобразуем в локальные координаты: от -length/2 до +length/2
			const center = pos01 * length - length / 2;

			result.push({
				start: center - doorWidth / 2,
				end: center + doorWidth / 2,
				bottom: 0,
				top: doorHeight,
				type: "door",
			});
		});

		windows.forEach((window) => {
			const windowWidth = window.width / 1000;
			const windowHeight = window.height / 1000;
			const sillHeight = window.sillHeight / 1000;
			// window.position от 0 до 1 - позиция от "начала" стены
			// Если стена перевёрнута (flipAlongLength), то интерпретируем
			// позицию от противоположного края: 1 - position
			const pos01 = flipAlongLength ? 1 - window.position : window.position;
			const center = pos01 * length - length / 2;

			const FRAME_THICKNESS = 0.05;
			const openingWidth = windowWidth + FRAME_THICKNESS * 2;

			result.push({
				start: center - openingWidth / 2,
				end: center + openingWidth / 2,
				bottom: sillHeight - FRAME_THICKNESS,
				top: sillHeight + windowHeight + FRAME_THICKNESS,
				type: "window",
			});
		});

		return result.sort((a, b) => a.start - b.start);
	}, [doors, windows, length, flipAlongLength]);

	// Создаем сегменты стены между проёмами
	const segments = useMemo(() => {
		const segs: Array<{
			x: number;
			y: number;
			width: number;
			height: number;
		}> = [];

		const halfHeight = height / 2;

		// Начинаем с левого края стены
		let currentX = -length / 2;

		openings.forEach((opening) => {
			// Сегмент слева от проёма (если есть пространство) — полный по высоте
			if (opening.start > currentX) {
				const segmentWidth = opening.start - currentX;
				const segmentCenterX = currentX + segmentWidth / 2;

				segs.push({
					x: segmentCenterX,
					y: 0, // центр по высоте (локально)
					width: segmentWidth,
					height: height,
				});
			}

			const openingCenterX = (opening.start + opening.end) / 2;
			const openingWidth = opening.end - opening.start;

			// Нижняя часть под проёмом (если проём не начинается от пола)
			if (opening.bottom > 0) {
				const bottomHeight = opening.bottom; // от 0 до opening.bottom (глобально)
				const centerGlobal = bottomHeight / 2; // 0..height
				const centerLocal = centerGlobal - halfHeight; // -height/2..height/2

				segs.push({
					x: openingCenterX,
					y: centerLocal,
					width: openingWidth,
					height: bottomHeight,
				});
			}

			// Верхняя часть над проёмом (если проём не доходит до потолка)
			if (opening.top < height) {
				const topHeight = height - opening.top; // от opening.top до height
				const centerGlobal = opening.top + topHeight / 2;
				const centerLocal = centerGlobal - halfHeight;

				segs.push({
					x: openingCenterX,
					y: centerLocal,
					width: openingWidth,
					height: topHeight,
				});
			}

			currentX = opening.end;
		});

		// Последний сегмент справа (если есть пространство) — полный по высоте
		if (currentX < length / 2) {
			const segmentWidth = length / 2 - currentX;
			const segmentCenterX = currentX + segmentWidth / 2;

			segs.push({
				x: segmentCenterX,
				y: 0, // центр по высоте
				width: segmentWidth,
				height: height,
			});
		}

		return segs;
	}, [length, height, openings]);

	return (
		<>
			{segments.map((seg, idx) => (
				<mesh key={idx} position={[seg.x, seg.y, 0]} castShadow receiveShadow>
					<boxGeometry args={[seg.width, seg.height, thickness]} />
					<meshStandardMaterial
						color={material.color}
						roughness={material.roughness}
						metalness={material.metalness}
					/>
				</mesh>
			))}
		</>
	);
}
