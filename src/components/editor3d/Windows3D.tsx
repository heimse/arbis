"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import type { Vector3 } from "three";
import { Vector3 as THREE_Vector3, Group, DoubleSide } from "three";
import type { Window, Layer, Wall, Node } from "@/types/editor";
import type { LayerId } from "@/types/editor";
import { mmToMeters, isLayerVisible } from "./utils3d";
import { computeWallBasis } from "./Walls3D";
import type { WallBasis } from "./Walls3D";
import type { WallCut } from "./Doors3D";
import { useEditor3DInteraction } from "./Editor3DInteractionContext";

const FRAME_THICKNESS = 0.05;
const FRAME_DEPTH = 0.15;
const GLASS_THICKNESS = 0.01;
const GLASS_GAP = 0.01;
const SASH_THICKNESS = 0.04;
const SASH_OFFSET = 0.02;

/**
 * Скорость открытия/закрытия окна (рад/с)
 */
const WINDOW_OPEN_SPEED = 6;

enum WindowOpenState {
	Closed = 0,
	Vent = 1,
	Open = 2,
}

export function buildWindowCutsForWall(
	wallId: string,
	windows: Window[],
	layers: Map<LayerId, Layer>,
	wallLength: number,
	wallHeight: number,
	flipAlongLength: boolean
): WallCut[] {
	const cuts: WallCut[] = [];

	for (const window of windows) {
		if (window.wallId !== wallId) {
			continue;
		}

		if (!isLayerVisible(window.layerId, layers)) {
			continue;
		}

		const widthMeters = mmToMeters(window.width);
		const heightMeters = mmToMeters(window.height);
		const sillMeters = mmToMeters(window.sillHeight);

		let position01 = window.position;
		if (flipAlongLength) {
			position01 = 1 - position01;
		}
		const centerX = position01 * wallLength - wallLength / 2;

		const cutXStart = centerX - widthMeters / 2;
		const cutXEnd = centerX + widthMeters / 2;

		const cutYBottom = sillMeters;
		const cutYTop = Math.min(sillMeters + heightMeters, wallHeight);

		if (
			cutXStart < wallLength / 2 &&
			cutXEnd > -wallLength / 2 &&
			cutYBottom < cutYTop &&
			cutYTop > 0 &&
			cutYBottom < wallHeight
		) {
			cuts.push({
				wallId,
				xStart: Math.max(cutXStart, -wallLength / 2),
				xEnd: Math.min(cutXEnd, wallLength / 2),
				yBottom: Math.max(cutYBottom, 0),
				yTop: Math.min(cutYTop, wallHeight),
			});
		}
	}

	return cuts;
}

interface WindowMeshProps {
	window: Window;
	basis: WallBasis;
	layers: Map<string, Layer>;
}

/**
 * Вычисляет целевые углы окна на основе состояния
 * @param openState - состояние окна
 * @param side - сторона окна (для определения направления открытия)
 * @returns объект с targetYaw и targetPitch
 */
function computeWindowTargetAngles(
	openState: WindowOpenState,
	side: "left" | "right" = "left"
): { targetYaw: number; targetPitch: number } {
	switch (openState) {
		case WindowOpenState.Closed:
			return { targetYaw: 0, targetPitch: 0 };
		case WindowOpenState.Vent:
			return { targetYaw: 0, targetPitch: -0.25 };
		case WindowOpenState.Open:
			// Открывается влево или вправо в зависимости от стороны
			return { targetYaw: side === "left" ? 1.1 : -1.1, targetPitch: 0 };
		default:
			return { targetYaw: 0, targetPitch: 0 };
	}
}

function WindowMesh({ window, basis, layers }: WindowMeshProps) {
	const [openState, setOpenState] = useState<WindowOpenState>(
		WindowOpenState.Closed
	);
	const currentYawRef = useRef(0);
	const targetYawRef = useRef(0);
	const currentPitchRef = useRef(0);
	const targetPitchRef = useRef(0);
	const hingeYRef = useRef<Group>(null);
	const hingeXRef = useRef<Group>(null);

	const { registerInteractiveObject, unregisterInteractiveObject } =
		useEditor3DInteraction();

	const windowWidth = mmToMeters(window.width);
	const windowHeight = mmToMeters(window.height);
	const sillHeight = mmToMeters(window.sillHeight);

	let position01 = window.position;
	if (basis.flipAlongLength) {
		position01 = 1 - position01;
	}
	const localCenterX = position01 * basis.length - basis.length / 2;
	const localY = sillHeight + windowHeight / 2;
	const localZ = basis.thickness / 2 + SASH_OFFSET + 0.001;

	const worldPosition = useMemo(() => {
		const localPos = new THREE_Vector3(localCenterX, localY, localZ);
		const rotated = new THREE_Vector3()
			.addScaledVector(basis.basis.xAxis, localPos.x)
			.addScaledVector(basis.basis.yAxis, localPos.y)
			.addScaledVector(basis.basis.zAxis, localPos.z);
		return basis.basis.origin.clone().add(rotated);
	}, [basis, localCenterX, localY, localZ]);

	// Вычисляем целевые углы при изменении состояния
	// Для окон используем "left" по умолчанию (можно расширить, если в типе Window будет side)
	useEffect(() => {
		const { targetYaw, targetPitch } = computeWindowTargetAngles(
			openState,
			"left"
		);
		targetYawRef.current = targetYaw;
		targetPitchRef.current = targetPitch;
	}, [openState]);

	// Плавная анимация открытия/закрытия
	useFrame((_, delta) => {
		// Интерполируем yaw
		const yawDiff = targetYawRef.current - currentYawRef.current;
		if (Math.abs(yawDiff) > 1e-3) {
			currentYawRef.current += yawDiff * delta * WINDOW_OPEN_SPEED;
		}

		// Интерполируем pitch
		const pitchDiff = targetPitchRef.current - currentPitchRef.current;
		if (Math.abs(pitchDiff) > 1e-3) {
			currentPitchRef.current += pitchDiff * delta * WINDOW_OPEN_SPEED;
		}

		// Применяем к pivot-группам
		if (hingeYRef.current) {
			hingeYRef.current.rotation.y = currentYawRef.current;
		}
		if (hingeXRef.current) {
			hingeXRef.current.rotation.x = currentPitchRef.current;
		}
	});

	// Toggle функция для циклического переключения состояний
	const toggle = useCallback(() => {
		setOpenState((prev) => {
			switch (prev) {
				case WindowOpenState.Closed:
					return WindowOpenState.Vent;
				case WindowOpenState.Vent:
					return WindowOpenState.Open;
				case WindowOpenState.Open:
				default:
					return WindowOpenState.Closed;
			}
		});
	}, []);

	// Регистрация в контекст взаимодействий
	const visibleLayer = isLayerVisible(window.layerId, layers);
	useEffect(() => {
		if (!visibleLayer) {
			return;
		}

		const handle = {
			id: window.id,
			type: "window" as const,
			toggle,
		};

		registerInteractiveObject(handle);

		return () => {
			unregisterInteractiveObject(window.id, "window");
		};
	}, [
		window.id,
		visibleLayer,
		toggle,
		registerInteractiveObject,
		unregisterInteractiveObject,
	]);

	const sashWidth = windowWidth - FRAME_THICKNESS * 2;
	const sashHeight = windowHeight - FRAME_THICKNESS * 2;

	// Не рендерим окно, если слой невидим
	if (!visibleLayer) {
		return null;
	}

	return (
		<group position={worldPosition} rotation-y={basis.angleRad}>
			<group position={[0, 0, -localZ + basis.thickness / 2]}>
				<mesh
					position={[0, windowHeight / 2 - FRAME_THICKNESS / 2, 0]}
					castShadow
					receiveShadow
				>
					<boxGeometry args={[windowWidth, FRAME_THICKNESS, FRAME_DEPTH]} />
					<meshStandardMaterial
						color="#e5e7eb"
						roughness={0.9}
						metalness={0.0}
					/>
				</mesh>
				<mesh
					position={[0, -windowHeight / 2 + FRAME_THICKNESS / 2, 0]}
					castShadow
					receiveShadow
				>
					<boxGeometry args={[windowWidth, FRAME_THICKNESS, FRAME_DEPTH]} />
					<meshStandardMaterial
						color="#e5e7eb"
						roughness={0.9}
						metalness={0.0}
					/>
				</mesh>
				<mesh
					position={[-windowWidth / 2 + FRAME_THICKNESS / 2, 0, 0]}
					castShadow
					receiveShadow
				>
					<boxGeometry args={[FRAME_THICKNESS, windowHeight, FRAME_DEPTH]} />
					<meshStandardMaterial
						color="#e5e7eb"
						roughness={0.9}
						metalness={0.0}
					/>
				</mesh>
				<mesh
					position={[windowWidth / 2 - FRAME_THICKNESS / 2, 0, 0]}
					castShadow
					receiveShadow
				>
					<boxGeometry args={[FRAME_THICKNESS, windowHeight, FRAME_DEPTH]} />
					<meshStandardMaterial
						color="#e5e7eb"
						roughness={0.9}
						metalness={0.0}
					/>
				</mesh>
			</group>
			<group
				ref={hingeYRef}
				position={[
					-windowWidth / 2 + FRAME_THICKNESS,
					0,
					-localZ + basis.thickness / 2,
				]}
			>
				<group ref={hingeXRef}>
					<mesh
						position={[sashWidth / 2, 0, 0]}
						castShadow
						receiveShadow
						onClick={toggle}
						userData={{
							objectId: window.id,
							objectType: "window",
						}}
					>
						<boxGeometry args={[sashWidth, sashHeight, SASH_THICKNESS]} />
						<meshStandardMaterial
							color="#f3f4f6"
							roughness={0.85}
							metalness={0.0}
						/>
					</mesh>
					<mesh
						position={[sashWidth / 2, 0, -SASH_THICKNESS / 2 - GLASS_GAP / 2]}
						receiveShadow
						castShadow={false}
					>
						<planeGeometry args={[sashWidth * 0.95, sashHeight * 0.95]} />
						<meshStandardMaterial
							color="#5dade2"
							opacity={0.2}
							transparent
							roughness={0.05}
							metalness={0.1}
							side={DoubleSide}
							emissive="#000000"
							emissiveIntensity={0}
						/>
					</mesh>
					<mesh
						position={[
							sashWidth / 2,
							0,
							-SASH_THICKNESS / 2 - GLASS_GAP - GLASS_THICKNESS / 2,
						]}
						receiveShadow
						castShadow={false}
					>
						<planeGeometry args={[sashWidth * 0.95, sashHeight * 0.95]} />
						<meshStandardMaterial
							color="#5dade2"
							opacity={0.2}
							transparent
							roughness={0.05}
							metalness={0.1}
							side={DoubleSide}
							emissive="#000000"
							emissiveIntensity={0}
						/>
					</mesh>
				</group>
			</group>
		</group>
	);
}

export interface Windows3DProps {
	windows: Map<string, Window>;
	walls: Map<string, Wall>;
	nodes: Map<string, Node>;
	layers: Map<string, Layer>;
}

export function Windows3D({ windows, walls, nodes, layers }: Windows3DProps) {
	const windowInstances = useMemo(() => {
		const instances: Array<{ window: Window; basis: WallBasis }> = [];

		for (const window of windows.values()) {
			if (!isLayerVisible(window.layerId, layers)) {
				continue;
			}

			const wall = walls.get(window.wallId);
			if (!wall) {
				continue;
			}

			const basis = computeWallBasis(wall, nodes);
			if (!basis) {
				continue;
			}

			instances.push({ window, basis });
		}

		return instances;
	}, [windows, walls, nodes, layers]);

	return (
		<>
			{windowInstances.map(({ window, basis }) => (
				<WindowMesh
					key={window.id}
					window={window}
					basis={basis}
					layers={layers}
				/>
			))}
		</>
	);
}
