"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, Grid } from "@react-three/drei";
import { EditorState } from "@/types/editor";
import { Walls3D } from "./Walls3D";
import { Floor3D } from "./Floor3D";
import { Rooms3D } from "./Rooms3D";
import { Doors3D } from "./Doors3D";
import { Windows3D } from "./Windows3D";
import { Furniture3D } from "./Furniture3D";
import * as THREE from "three";
import { Raycaster, Vector2 } from "three";

export interface Plan3DViewerProps {
	state: EditorState;
	className?: string;
	style?: React.CSSProperties;
	onObjectClick?: (
		objectId: string,
		objectType: string,
		point: THREE.Vector3
	) => void;
}

/**
 * 3D визуализатор планировки
 * Координаты: X/Z - горизонтальная плоскость, Y - высота
 * Единицы: метры
 */
export function Plan3DViewer({
	state,
	className,
	style,
	onObjectClick,
}: Plan3DViewerProps) {
	// Реф для контейнера Canvas
	const containerRef = useRef<HTMLDivElement>(null);
	// Вычисляем bounding box для всех узлов
	const bounds = useMemo(() => {
		const nodes = Array.from(state.nodes.values());
		if (nodes.length === 0) {
			return { minX: 0, maxX: 10, minZ: 0, maxZ: 10, centerX: 5, centerZ: 5 };
		}

		let minX = Infinity;
		let maxX = -Infinity;
		let minZ = Infinity;
		let maxZ = -Infinity;

		nodes.forEach((node) => {
			minX = Math.min(minX, node.x);
			maxX = Math.max(maxX, node.x);
			minZ = Math.min(minZ, node.y); // node.y -> Z в 3D
			maxZ = Math.max(maxZ, node.y);
		});

		// Добавляем небольшой отступ
		const padding = 2;
		minX -= padding;
		maxX += padding;
		minZ -= padding;
		maxZ += padding;

		return {
			minX,
			maxX,
			minZ,
			maxZ,
			centerX: (minX + maxX) / 2,
			centerZ: (minZ + maxZ) / 2,
		};
	}, [state.nodes]);

	// Вычисляем начальную позицию камеры
	const cameraPosition = useMemo(() => {
		const size = Math.max(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ);
		const distance = size * 1.5;
		return [
			bounds.centerX + distance * 0.7,
			distance * 0.8,
			bounds.centerZ + distance * 0.7,
		] as [number, number, number];
	}, [bounds]);

	// Фильтруем видимые слои
	const visibleLayers = useMemo(() => {
		return new Set(
			Array.from(state.layers.values())
				.filter((layer) => layer.visible)
				.map((layer) => layer.id)
		);
	}, [state.layers]);

	const showWalls = visibleLayers.has("layer-walls");
	const showRooms = visibleLayers.has("layer-rooms");
	const showOpenings = visibleLayers.has("layer-openings");
	const showFurniture = visibleLayers.has("layer-furniture");

	// Проверка на клиент для предотвращения ошибок гидратации
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	if (!isMounted) {
		return (
			<div ref={containerRef} className={`relative ${className}`} style={style}>
				<div className="flex items-center justify-center h-full">
					<div className="text-gray-500">Загрузка 3D сцены...</div>
				</div>
			</div>
		);
	}

	return (
		<div ref={containerRef} className={`relative ${className}`} style={style}>
			<Canvas
				camera={{
					position: cameraPosition,
					fov: 50,
					near: 0.1,
					far: 1000,
				}}
				shadows
			>
				{/* Освещение */}
				<ambientLight intensity={0.5} />
				<directionalLight
					position={[10, 20, 10]}
					intensity={0.8}
					castShadow
					shadow-mapSize-width={2048}
					shadow-mapSize-height={2048}
					shadow-camera-far={50}
					shadow-camera-left={-20}
					shadow-camera-right={20}
					shadow-camera-top={20}
					shadow-camera-bottom={-20}
				/>
				<directionalLight position={[-10, 10, -10]} intensity={0.3} />

				{/* Environment для лучшего освещения */}
				<Environment preset="apartment" />

				{/* Базовый пол */}
				<Floor3D bounds={bounds} />

				{/* Комнаты (если видимы) */}
				{showRooms && (
					<Rooms3D
						rooms={Array.from(state.rooms.values())}
						layers={state.layers}
					/>
				)}

				{/* Стены (если видимы) */}
				{showWalls && (
					<Walls3D
						walls={Array.from(state.walls.values())}
						nodes={state.nodes}
						doors={Array.from(state.doors.values())}
						windows={Array.from(state.windows.values())}
					/>
				)}

				{/* Двери (если видимы) */}
				{showOpenings && (
					<Doors3D
						doors={Array.from(state.doors.values())}
						walls={state.walls}
						nodes={state.nodes}
					/>
				)}

				{/* Окна (если видимы) */}
				{showOpenings && (
					<Windows3D
						windows={Array.from(state.windows.values())}
						walls={state.walls}
						nodes={state.nodes}
					/>
				)}

				{/* Мебель (если видима) */}
				{showFurniture && (
					<Furniture3D
						furniture={Array.from(state.furniture.values())}
						layers={state.layers}
						furnitureCatalog={(state as any).plan?.furnitureCatalog}
					/>
				)}

				{/* Сетка для ориентации */}
				<Grid
					position={[bounds.centerX, 0.01, bounds.centerZ]}
					args={[
						Math.max(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ) * 2,
						Math.max(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ) * 2,
					]}
					cellSize={1}
					cellThickness={0.5}
					cellColor="#6e6e6e"
					sectionSize={5}
					sectionThickness={1}
					sectionColor="#9d9d9d"
					fadeDistance={100}
					fadeStrength={1}
					followCamera={false}
					infiniteGrid={false}
				/>

				{/* Контроллы камеры */}
				<OrbitControls
					target={[bounds.centerX, 1.4, bounds.centerZ]}
					enableDamping
					dampingFactor={0.05}
					minDistance={2}
					maxDistance={100}
					maxPolarAngle={Math.PI / 2 - 0.1} // Не опускаемся ниже пола
					enablePan
					panSpeed={0.5}
					rotateSpeed={0.5}
					zoomSpeed={0.8}
				/>

				{/* Обработчик кликов по сцене */}
				<SceneClickHandler onObjectClick={onObjectClick} />
			</Canvas>
		</div>
	);
}

/**
 * Компонент для обработки кликов по 3D сцене
 */
interface SceneClickHandlerProps {
	onObjectClick?: (
		objectId: string,
		objectType: string,
		point: THREE.Vector3
	) => void;
}

function SceneClickHandler({ onObjectClick }: SceneClickHandlerProps) {
	const { camera, scene, gl } = useThree();
	const raycaster = useRef(new Raycaster());
	const mouse = useRef(new Vector2());

	// Функция для поиска userData в объекте или его родителях
	const findObjectData = (
		object: THREE.Object3D
	): {
		objectId?: string;
		objectType?: string;
	} | null => {
		let current: THREE.Object3D | null = object;
		while (current) {
			if (current.userData.objectId && current.userData.objectType) {
				return {
					objectId: current.userData.objectId,
					objectType: current.userData.objectType,
				};
			}
			current = current.parent;
		}
		return null;
	};

	useEffect(() => {
		const handleClick = (event: MouseEvent) => {
			const canvas = gl.domElement;
			const rect = canvas.getBoundingClientRect();

			mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
			mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

			raycaster.current.setFromCamera(mouse.current, camera);

			// Получаем все объекты, которые пересекаются с лучом
			const intersects = raycaster.current.intersectObjects(
				scene.children,
				true
			);

			if (intersects.length > 0) {
				const intersection = intersects[0];
				const point = intersection.point;

				// Ищем объект для выделения
				const objectData = findObjectData(intersection.object);
				if (
					objectData &&
					objectData.objectId &&
					objectData.objectType &&
					onObjectClick
				) {
					onObjectClick(objectData.objectId, objectData.objectType, point);
				}
			}
		};

		const canvas = gl.domElement;
		canvas.addEventListener("click", handleClick);
		return () => {
			canvas.removeEventListener("click", handleClick);
		};
	}, [camera, scene, gl, onObjectClick]);

	return null;
}
