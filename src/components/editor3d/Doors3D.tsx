import React, { useMemo, useState, useRef } from "react";
import { useFrame, ThreeEvent } from "@react-three/fiber";
import { Door, Wall, Node } from "@/types/editor";
import * as THREE from "three";

interface Doors3DProps {
	doors: Door[];
	walls: Map<string, Wall>;
	nodes: Map<string, Node>;
}

const DOOR_THICKNESS = 0.04; // метры - толщина дверного полотна
const FRAME_THICKNESS = 0.05; // метры - толщина дверной коробки (вдоль стены)
const FRAME_DEPTH = 0.12; // метры - глубина дверной коробки (вглубь стены)
const FRAME_WIDTH = 0.08; // метры - ширина элементов коробки (вертикальные и горизонтальные)
const HANDLE_RADIUS = 0.015; // метры - радиус дверной ручки
const HANDLE_HEIGHT = 0.1; // метры - высота дверной ручки
const HANDLE_OFFSET = 0.02; // метры - отступ ручки от края двери
const HANDLE_Y_POSITION = 0.9; // доля высоты двери, где расположена ручка (0.9 = 90% от низа)

/**
 * Компонент для отрисовки дверей в 3D
 */
export function Doors3D({ doors, walls, nodes }: Doors3DProps) {
	return (
		<>
			{doors.map((door) => {
				const wall = walls.get(door.wallId);
				if (!wall) return null;

				return <Door3D key={door.id} door={door} wall={wall} nodes={nodes} />;
			})}
		</>
	);
}

interface Door3DProps {
	door: Door;
	wall: Wall;
	nodes: Map<string, Node>;
}

function Door3D({ door, wall, nodes }: Door3DProps) {
	const startNode = nodes.get(wall.startNodeId);
	const endNode = nodes.get(wall.endNodeId);
	const [isOpen, setIsOpen] = useState(false);
	const rotationRef = useRef(0); // текущий угол поворота двери
	const targetRotationRef = useRef(0); // целевой угол поворота
	const doorGroupRef = useRef<THREE.Group>(null); // ссылка на группу поворота двери

	if (!startNode || !endNode) return null;

	// Геометрия стены для позиционирования двери
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

		// Позиция двери вдоль стены (door.position от 0 до 1 - от начала до конца)
		// Если стена перевёрнута (flipAlongLength), то интерпретируем
		// позицию от противоположного края: 1 - position
		const pos01 = flipAlongLength ? 1 - door.position : door.position;
		// Локальные координаты X: от -length/2 до +length/2
		const doorPositionLocal = pos01 * length - length / 2;

		return {
			centerX,
			centerZ,
			doorXLocal: doorPositionLocal,
			angle,
			length,
		};
	}, [startNode, endNode, door.position]);

	// Размеры двери в метрах
	const doorWidth = door.width / 1000;
	const doorHeight = door.height / 1000;
	const wallThickness = wall.thickness / 1000;
	const wallHeight = wall.height || 2.8; // метры, должна совпадать с высотой стены в Walls3D

	// Локальная позиция двери в системе координат стены
	// Группа стены: position = [centerX, wallHeight / 2, centerZ], rotation = [0, angle, 0]
	//
	// Стена (box) обычно центрована по Y: от -wallHeight/2 до +wallHeight/2
	// Низ стены = -wallHeight / 2
	// Чтобы низ двери совпадал с низом стены:
	//   центр двери по Y = -wallHeight/2 + doorHeight/2
	const doorXLocal = wallGeometry.doorXLocal;
	const doorYLocal = -wallHeight / 2 + doorHeight / 2; // низ двери вровень с низом стены
	const doorZLocal = 0; // по центру толщины стены

	// Определяем сторону поворота двери
	// Если openDirection === 'left', дверь поворачивается вокруг левого края (отрицательное направление)
	// Если openDirection === 'right', дверь поворачивается вокруг правого края (положительное направление)
	const isLeftHinged = door.openDirection === "left";
	const pivotOffsetX = isLeftHinged ? -doorWidth / 2 : doorWidth / 2;

	// Обработчик клика для открытия/закрытия двери
	const handleDoorClick = (e: ThreeEvent<MouseEvent>) => {
		e.stopPropagation(); // Предотвращаем всплытие события
		setIsOpen((prev) => {
			const newState = !prev;
			// Угол открытия зависит от стороны поворота
			targetRotationRef.current = newState
				? isLeftHinged
					? Math.PI / 2
					: -Math.PI / 2
				: 0;
			return newState;
		});
	};

	// Анимация поворота двери
	useFrame((state, delta) => {
		const target = targetRotationRef.current;
		const current = rotationRef.current;
		const diff = target - current;

		if (Math.abs(diff) > 0.01) {
			// Плавная интерполяция
			rotationRef.current += diff * delta * 3; // скорость анимации
		} else {
			rotationRef.current = target;
		}

		// Обновляем rotation группы напрямую
		if (doorGroupRef.current) {
			doorGroupRef.current.rotation.y = rotationRef.current;
		}
	});

	// Цвета
	const doorColor = "#8b4513"; // коричневый цвет двери
	const frameColor = "#d4a574"; // цвет дверной коробки (светло-коричневый)
	const handleColor = "#c0c0c0"; // серебристый цвет ручки

	// Позиция ручки на двери
	const handleX = isLeftHinged
		? doorWidth / 2 - HANDLE_OFFSET
		: -doorWidth / 2 + HANDLE_OFFSET;
	const handleY = doorHeight * HANDLE_Y_POSITION - doorHeight / 2;

	return (
		<group
			position={[wallGeometry.centerX, wallHeight / 2, wallGeometry.centerZ]}
			rotation={[0, wallGeometry.angle, 0]}
			userData={{ objectId: door.id, objectType: "door-group" }}
		>
			{/* Дверная коробка (рама) */}
			{/* Верхняя часть коробки */}
			<mesh
				position={[
					doorXLocal,
					doorYLocal + doorHeight / 2 + FRAME_WIDTH / 2,
					-wallThickness / 2 + FRAME_DEPTH / 2,
				]}
				castShadow
				receiveShadow
			>
				<boxGeometry
					args={[doorWidth + FRAME_THICKNESS * 2, FRAME_WIDTH, FRAME_DEPTH]}
				/>
				<meshStandardMaterial
					color={frameColor}
					roughness={0.7}
					metalness={0.1}
				/>
			</mesh>

			{/* Левая вертикальная часть коробки */}
			<mesh
				position={[
					doorXLocal - doorWidth / 2 - FRAME_THICKNESS / 2,
					doorYLocal,
					-wallThickness / 2 + FRAME_DEPTH / 2,
				]}
				castShadow
				receiveShadow
			>
				<boxGeometry
					args={[FRAME_THICKNESS, doorHeight + FRAME_WIDTH, FRAME_DEPTH]}
				/>
				<meshStandardMaterial
					color={frameColor}
					roughness={0.7}
					metalness={0.1}
				/>
			</mesh>

			{/* Правая вертикальная часть коробки */}
			<mesh
				position={[
					doorXLocal + doorWidth / 2 + FRAME_THICKNESS / 2,
					doorYLocal,
					-wallThickness / 2 + FRAME_DEPTH / 2,
				]}
				castShadow
				receiveShadow
			>
				<boxGeometry
					args={[FRAME_THICKNESS, doorHeight + FRAME_WIDTH, FRAME_DEPTH]}
				/>
				<meshStandardMaterial
					color={frameColor}
					roughness={0.7}
					metalness={0.1}
				/>
			</mesh>

			{/* Группа для поворота двери */}
			<group
				ref={doorGroupRef}
				position={[doorXLocal + pivotOffsetX, doorYLocal, doorZLocal]}
				rotation={[0, 0, 0]}
			>
				{/* Дверное полотно с панелями для более реалистичного вида */}
				{/* Дверь позиционируется внутри коробки, немного отступая от края стены */}
				<mesh
					position={[
						-pivotOffsetX,
						0,
						-wallThickness / 2 + FRAME_DEPTH - DOOR_THICKNESS / 2 - 0.01,
					]}
					onClick={handleDoorClick}
					onPointerOver={(e: ThreeEvent<PointerEvent>) => {
						e.stopPropagation();
						document.body.style.cursor = "pointer";
					}}
					onPointerOut={(e: ThreeEvent<PointerEvent>) => {
						e.stopPropagation();
						document.body.style.cursor = "default";
					}}
					castShadow
					receiveShadow
					userData={{ objectId: door.id, objectType: "door" }}
				>
					{/* Основное полотно двери */}
					<boxGeometry args={[doorWidth, doorHeight, DOOR_THICKNESS]} />
					<meshStandardMaterial
						color={doorColor}
						roughness={0.7}
						metalness={0.1}
					/>
				</mesh>

				{/* Верхняя панель двери (декоративная) */}
				<mesh
					position={[
						-pivotOffsetX,
						doorHeight / 2 - doorHeight * 0.15,
						-wallThickness / 2 + FRAME_DEPTH - DOOR_THICKNESS / 2 - 0.005,
					]}
					castShadow
					receiveShadow
				>
					<boxGeometry
						args={[doorWidth * 0.85, doorHeight * 0.2, DOOR_THICKNESS * 0.3]}
					/>
					<meshStandardMaterial
						color={doorColor}
						roughness={0.8}
						metalness={0.05}
					/>
				</mesh>

				{/* Нижняя панель двери (декоративная) */}
				<mesh
					position={[
						-pivotOffsetX,
						-doorHeight / 2 + doorHeight * 0.15,
						-wallThickness / 2 + FRAME_DEPTH - DOOR_THICKNESS / 2 - 0.005,
					]}
					castShadow
					receiveShadow
				>
					<boxGeometry
						args={[doorWidth * 0.85, doorHeight * 0.2, DOOR_THICKNESS * 0.3]}
					/>
					<meshStandardMaterial
						color={doorColor}
						roughness={0.8}
						metalness={0.05}
					/>
				</mesh>

				{/* Дверная ручка */}
				<mesh
					position={[
						-pivotOffsetX + handleX,
						handleY,
						-wallThickness / 2 +
							FRAME_DEPTH -
							DOOR_THICKNESS / 2 +
							HANDLE_RADIUS,
					]}
					castShadow
					userData={{ objectId: door.id, objectType: "door-handle" }}
				>
					<cylinderGeometry
						args={[HANDLE_RADIUS, HANDLE_RADIUS, HANDLE_HEIGHT, 16]}
					/>
					<meshStandardMaterial
						color={handleColor}
						roughness={0.3}
						metalness={0.8}
					/>
				</mesh>
			</group>
		</group>
	);
}
