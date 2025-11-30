import React, { useMemo } from "react";
import { Window, Wall, Node } from "@/types/editor";

interface Windows3DProps {
	windows: Window[];
	walls: Map<string, Wall>;
	nodes: Map<string, Node>;
}

const FRAME_THICKNESS = 0.05; // метры - толщина рамы (вдоль стены)
const FRAME_DEPTH = 0.15; // метры - глубина рамы (вглубь стены)
const GLASS_THICKNESS = 0.01; // метры - толщина стекла

/**
 * Компонент для отрисовки окон в 3D
 */
export function Windows3D({ windows, walls, nodes }: Windows3DProps) {
	return (
		<>
			{windows.map((window) => {
				const wall = walls.get(window.wallId);
				if (!wall) return null;

				return (
					<Window3D key={window.id} window={window} wall={wall} nodes={nodes} />
				);
			})}
		</>
	);
}

interface Window3DProps {
	window: Window;
	wall: Wall;
	nodes: Map<string, Node>;
}

function Window3D({ window, wall, nodes }: Window3DProps) {
	const startNode = nodes.get(wall.startNodeId);
	const endNode = nodes.get(wall.endNodeId);

	if (!startNode || !endNode) return null;

	// Вычисляем геометрию стены для позиционирования окна
	const wallGeometry = useMemo(() => {
		const dx = endNode.x - startNode.x;
		const dz = endNode.y - startNode.y;
		const length = Math.sqrt(dx * dx + dz * dz);
		const angle = Math.atan2(dz, dx);

		// Центр стены в глобальных координатах
		const centerX = (startNode.x + endNode.x) / 2;
		const centerZ = (startNode.y + endNode.y) / 2;

		// Определяем, нужно ли переворачивать позицию проёмов вдоль стены
		// Если стена идёт влево в глобальных координатах - считаем её перевёрнутой
		// Для вертикальных стен (dx ≈ 0) НИКОГДА не переворачиваем
		const isVertical = Math.abs(dx) < 1e-6;
		const flipAlongLength = isVertical ? false : dx < 0;

		// Позиция окна вдоль стены (window.position от 0 до 1 - от начала до конца стены)
		// Если стена перевёрнута (flipAlongLength), то интерпретируем
		// позицию от противоположного края: 1 - position
		const pos01 = flipAlongLength ? 1 - window.position : window.position;
		// Преобразуем в локальные координаты: от -length/2 до +length/2
		const windowPositionLocal = pos01 * length - length / 2;

		return {
			centerX,
			centerZ,
			windowXLocal: windowPositionLocal, // локальная координата X относительно центра стены
			angle,
			length,
		};
	}, [startNode, endNode, window.position]);

	// Размеры окна в метрах
	const windowWidth = window.width / 1000;
	const windowHeight = window.height / 1000;
	const sillHeight = window.sillHeight / 1000;
	const wallThickness = wall.thickness / 1000;

	// Центр окна по высоте
	const windowCenterY = sillHeight + windowHeight / 2;

	// Цвет рамы - белый или светло-серый
	const frameColor = "#e5e7eb";

	// Позиционируем окно в глобальных координатах
	// windowXLocal - это локальная координата X вдоль стены (от -length/2 до +length/2)
	// Преобразуем в глобальные координаты, используя угол стены
	// Для вертикальных стен (dx ≈ 0, angle ≈ π/2): cos(π/2) = 0, sin(π/2) = 1
	// Поэтому изменение по X = 0, изменение по Z = windowXLocal
	const cosAngle = Math.cos(wallGeometry.angle);
	const sinAngle = Math.sin(wallGeometry.angle);

	return (
		<group
			position={[
				wallGeometry.centerX + wallGeometry.windowXLocal * cosAngle,
				windowCenterY,
				wallGeometry.centerZ + wallGeometry.windowXLocal * sinAngle,
			]}
			rotation={[0, wallGeometry.angle, 0]}
			userData={{ objectId: window.id, objectType: "window" }}
		>
			{/* Верхняя часть рамы - вдоль стены (X), вглубь стены (Z) */}
			{/* Позиция: центр на windowHeight/2 + FRAME_THICKNESS/2 от центра окна по Y, z=0 по Z */}
			<mesh
				position={[0, windowHeight / 2 + FRAME_THICKNESS / 2, 0]}
				castShadow
			>
				<boxGeometry
					args={[
						windowWidth + FRAME_THICKNESS * 2,
						FRAME_THICKNESS,
						FRAME_DEPTH,
					]}
				/>
				<meshStandardMaterial
					color={frameColor}
					roughness={0.6}
					metalness={0.2}
				/>
			</mesh>

			{/* Нижняя часть рамы */}
			<mesh
				position={[0, -windowHeight / 2 - FRAME_THICKNESS / 2, 0]}
				castShadow
			>
				<boxGeometry
					args={[
						windowWidth + FRAME_THICKNESS * 2,
						FRAME_THICKNESS,
						FRAME_DEPTH,
					]}
				/>
				<meshStandardMaterial
					color={frameColor}
					roughness={0.6}
					metalness={0.2}
				/>
			</mesh>

			{/* Левая часть рамы (относительно направления стены) */}
			{/* Позиция: центр на -windowWidth/2 - FRAME_THICKNESS/2 от центра окна по X, z=0 по Z */}
			{/* Внешний левый край должен быть на -windowWidth/2 - FRAME_THICKNESS */}
			<mesh
				position={[-windowWidth / 2 - FRAME_THICKNESS / 2, 0, 0]}
				castShadow
			>
				<boxGeometry
					args={[
						FRAME_THICKNESS,
						windowHeight + FRAME_THICKNESS * 2,
						FRAME_DEPTH,
					]}
				/>
				<meshStandardMaterial
					color={frameColor}
					roughness={0.6}
					metalness={0.2}
				/>
			</mesh>

			{/* Правая часть рамы (относительно направления стены) */}
			{/* Позиция: центр на windowWidth/2 + FRAME_THICKNESS/2 от центра окна по X, z=0 по Z */}
			{/* Внешний правый край должен быть на windowWidth/2 + FRAME_THICKNESS */}
			<mesh position={[windowWidth / 2 + FRAME_THICKNESS / 2, 0, 0]} castShadow>
				<boxGeometry
					args={[
						FRAME_THICKNESS,
						windowHeight + FRAME_THICKNESS * 2,
						FRAME_DEPTH,
					]}
				/>
				<meshStandardMaterial
					color={frameColor}
					roughness={0.6}
					metalness={0.2}
				/>
			</mesh>

			{/* Стекло - полупрозрачное, встроено в раму, центрировано по Z */}
			<mesh position={[0, 0, 0]}>
				<boxGeometry
					args={[
						windowWidth - FRAME_THICKNESS * 2,
						windowHeight - FRAME_THICKNESS * 2,
						GLASS_THICKNESS,
					]}
				/>
				<meshStandardMaterial
					color="#87ceeb"
					transparent
					opacity={0.3}
					roughness={0.1}
					metalness={0.1}
				/>
			</mesh>
		</group>
	);
}
