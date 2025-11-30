"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import type { Vector3 } from "three";
import { GridHelper } from "three";
import type { EditorState } from "@/types/editor";
import { Floor3D } from "./Floor3D";
import { FirstPersonCameraController } from "./FirstPersonCameraController";
import { Walls3D } from "./Walls3D";
import { Doors3D } from "./Doors3D";
import { Windows3D } from "./Windows3D";
import { Rooms3D } from "./Rooms3D";
import { Furniture3D } from "./Furniture3D";
import { Ceilings3D } from "./Ceilings3D";
import { Editor3DInteractionProvider } from "./Editor3DInteractionContext";

export type CameraMode = "orbit" | "firstPerson";

export interface Plan3DViewerProps {
	state: EditorState;
	className?: string;
	style?: React.CSSProperties;
	initialCameraMode?: CameraMode;
	onObjectClick?: (
		objectId: string,
		objectType: string,
		point: Vector3
	) => void;
}

/**
 * Вычисляет bounding box по всем узлам планировки
 */
function computeBounds(nodes: EditorState["nodes"]) {
	if (nodes.size === 0) {
		// Дефолтный bbox для пустого плана
		return {
			minX: -5,
			maxX: 5,
			minZ: -5,
			maxZ: 5,
			centerX: 0,
			centerZ: 0,
		};
	}

	let minX = Infinity;
	let maxX = -Infinity;
	let minZ = Infinity;
	let maxZ = -Infinity;

	for (const node of nodes.values()) {
		minX = Math.min(minX, node.x);
		maxX = Math.max(maxX, node.x);
		minZ = Math.min(minZ, node.y);
		maxZ = Math.max(maxZ, node.y);
	}

	const centerX = (minX + maxX) / 2;
	const centerZ = (minZ + maxZ) / 2;

	return {
		minX,
		maxX,
		minZ,
		maxZ,
		centerX,
		centerZ,
	};
}

/**
 * Компонент ненавязчивой сетки пола
 */
function SubtleGrid({ bounds }: { bounds: ReturnType<typeof computeBounds> }) {
	const gridRef = useRef<GridHelper>(null);

	const { size, divisions } = useMemo(() => {
		// Вычисляем размеры планировки
		const baseWidth = bounds.maxX - bounds.minX;
		const baseDepth = bounds.maxZ - bounds.minZ;

		// Если план пустой, используем дефолтный размер сетки 20x20
		const DEFAULT_FLOOR_SIZE = 20;
		let gridSize: number;
		if (baseWidth < 15 && baseDepth < 15) {
			gridSize = DEFAULT_FLOOR_SIZE;
		} else {
			const maxDimension = Math.max(baseWidth, baseDepth);
			const padding = Math.max(maxDimension * 0.25, 3);
			// Размер сетки должен покрывать пол (чуть больше)
			gridSize = Math.max(baseWidth, baseDepth) + padding * 2 + 2;
		}

		// Шаг сетки: 1 метр, делим на подразделения для более мелкой сетки
		const step = 1;
		const gridDivisions = Math.ceil(gridSize / step);

		return {
			size: gridSize,
			divisions: gridDivisions,
		};
	}, [bounds]);

	// Настраиваем цвета сетки после создания
	useEffect(() => {
		if (gridRef.current) {
			const material = gridRef.current.material;
			if (material && "color" in material) {
				// Мягкий серый цвет для основных линий
				material.color.setHex(0x888888);
				material.opacity = 0.3;
				material.transparent = true;
			}
		}
	}, []);

	return (
		<gridHelper
			ref={gridRef}
			args={[size, divisions, "#888888", "#888888"]}
			position={[bounds.centerX, 0.01, bounds.centerZ]}
		/>
	);
}

/**
 * Внутренний компонент сцены (рендерится внутри Canvas)
 */
function SceneContent({
	state,
	onObjectClick,
	cameraMode,
	bounds,
}: {
	state: EditorState;
	onObjectClick?: Plan3DViewerProps["onObjectClick"];
	cameraMode: CameraMode;
	bounds: ReturnType<typeof computeBounds>;
}) {
	return (
		<>
			{/* Освещение */}
			<ambientLight intensity={0.5} />

			{/* Основной направленный свет с тенями */}
			<directionalLight
				position={[10, 20, 10]}
				intensity={0.8}
				castShadow
				shadow-mapSize-width={2048}
				shadow-mapSize-height={2048}
				shadow-camera-left={-20}
				shadow-camera-right={20}
				shadow-camera-top={20}
				shadow-camera-bottom={-20}
				shadow-camera-near={0.1}
				shadow-camera-far={50}
			/>

			{/* Дополнительный направленный свет для мягкости */}
			<directionalLight position={[-10, 10, -10]} intensity={0.3} />

			{/* Окружающая среда */}
			<Environment preset="apartment" />

			{/* Ненавязчивая сетка */}
			<SubtleGrid bounds={bounds} />

			{/* Пол */}
			<Floor3D bounds={bounds} />

			{/* Стены */}
			<Walls3D
				walls={state.walls}
				nodes={state.nodes}
				layers={state.layers}
				doors={state.doors}
				windows={state.windows}
			/>

			{/* Двери */}
			<Doors3D
				doors={state.doors}
				walls={state.walls}
				nodes={state.nodes}
				layers={state.layers}
			/>

			{/* Окна */}
			<Windows3D
				windows={state.windows}
				walls={state.walls}
				nodes={state.nodes}
				layers={state.layers}
			/>

			{/* Полы комнат */}
			<Rooms3D rooms={state.rooms} layers={state.layers} />

			{/* Мебель */}
			<Furniture3D furniture={state.furniture} layers={state.layers} />

			{/* Потолки комнат */}
			<Ceilings3D
				rooms={state.rooms}
				walls={state.walls}
				layers={state.layers}
			/>

			{/* Управление камерой от первого лица */}
			{cameraMode === "firstPerson" && (
				<FirstPersonCameraController
					centerX={bounds.centerX}
					centerZ={bounds.centerZ}
					floorY={0}
					initialHeight={1.7}
				/>
			)}
		</>
	);
}

/**
 * Компонент UI для переключения режимов камеры
 */
function CameraModeToggle({
	cameraMode,
	onToggle,
}: {
	cameraMode: CameraMode;
	onToggle: () => void;
}) {
	return (
		<div
			style={{
				position: "absolute",
				top: "16px",
				right: "16px",
				zIndex: 10,
				display: "flex",
				flexDirection: "column",
				gap: "8px",
				backgroundColor: "rgba(0, 0, 0, 0.6)",
				padding: "12px",
				borderRadius: "8px",
				color: "white",
				fontSize: "14px",
				fontFamily: "system-ui, sans-serif",
			}}
		>
			<div>Режим: {cameraMode === "orbit" ? "Орбита" : "От первого лица"}</div>
			<button
				onClick={onToggle}
				style={{
					padding: "6px 12px",
					backgroundColor: "#3b82f6",
					color: "white",
					border: "none",
					borderRadius: "4px",
					cursor: "pointer",
					fontSize: "12px",
					fontWeight: "500",
				}}
				onMouseEnter={(e) => {
					e.currentTarget.style.backgroundColor = "#2563eb";
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.backgroundColor = "#3b82f6";
				}}
			>
				Переключить на {cameraMode === "orbit" ? "От первого лица" : "Орбиту"}
			</button>
		</div>
	);
}

/**
 * Основной компонент 3D-визуализатора планировки
 */
export function Plan3DViewer({
	state,
	className,
	style,
	initialCameraMode = "orbit",
	onObjectClick,
}: Plan3DViewerProps) {
	// Локальное состояние режима камеры
	const [cameraMode, setCameraMode] = useState<CameraMode>(initialCameraMode);

	// Вычисляем bounds для камеры
	const bounds = useMemo(() => computeBounds(state.nodes), [state.nodes]);

	// Позиция камеры и target для OrbitControls
	const cameraPosition = useMemo<[number, number, number]>(
		() => [bounds.centerX + 10, 10, bounds.centerZ + 10],
		[bounds]
	);

	const controlsTarget = useMemo<[number, number, number]>(
		() => [bounds.centerX, 1.4, bounds.centerZ],
		[bounds]
	);

	// Функция переключения режима камеры
	const handleToggleCameraMode = () => {
		setCameraMode((prev) => (prev === "orbit" ? "firstPerson" : "orbit"));
	};

	return (
		<div className={className} style={{ position: "relative", ...style }}>
			<Editor3DInteractionProvider>
				<Canvas
					shadows
					camera={{
						position: cameraPosition,
						fov: 50,
						near: 0.1,
						far: 200,
					}}
				>
					<SceneContent
						state={state}
						onObjectClick={onObjectClick}
						cameraMode={cameraMode}
						bounds={bounds}
					/>
					{/* OrbitControls рендерится только в режиме orbit */}
					{cameraMode === "orbit" && (
						<OrbitControls
							target={controlsTarget}
							minDistance={2}
							maxDistance={100}
							maxPolarAngle={Math.PI * 0.5 * 0.9}
							rotateSpeed={0.5}
							panSpeed={0.5}
							zoomSpeed={0.8}
						/>
					)}
				</Canvas>
			</Editor3DInteractionProvider>
			{/* UI переключатель режимов камеры */}
			<CameraModeToggle
				cameraMode={cameraMode}
				onToggle={handleToggleCameraMode}
			/>
		</div>
	);
}
