"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import type { Vector3 } from "three";
import { Vector3 as THREE_Vector3, Group } from "three";
import type { Door, Layer, Wall, Node } from "@/types/editor";
import type { LayerId } from "@/types/editor";
import {
	mmToMeters,
	isLayerVisible,
	normalizeDoorOrientation,
} from "./utils3d";
import { computeWallBasis } from "./Walls3D";
import type { WallBasis } from "./Walls3D";
import { useEditor3DInteraction } from "./Editor3DInteractionContext";

export interface WallCut {
	wallId: string;
	xStart: number;
	xEnd: number;
	yBottom: number;
	yTop: number;
}

const DOOR_THICKNESS = 0.04;
const FRAME_DEPTH = 0.12;
const FRAME_WIDTH = 0.08;
const HANDLE_RADIUS = 0.015;
const HANDLE_LENGTH = 0.1;
const HANDLE_OFFSET_FROM_EDGE = 0.05;
const HANDLE_HEIGHT_FACTOR = 0.9;
const DOOR_FLOOR_GAP = 0.02;

/**
 * Скорость открытия/закрытия двери (рад/с)
 */
const DOOR_OPEN_SPEED = 6;

enum DoorOpenState {
	Closed = 0,
	Open = 1,
}

export function buildDoorCutsForWall(
	wallId: string,
	doors: Door[],
	layers: Map<LayerId, Layer>,
	wallLength: number,
	wallHeight: number,
	flipAlongLength: boolean
): WallCut[] {
	const cuts: WallCut[] = [];

	for (const door of doors) {
		if (door.wallId !== wallId) {
			continue;
		}

		if (!isLayerVisible(door.layerId, layers)) {
			continue;
		}

		const widthMeters = mmToMeters(door.width);
		const heightMeters = mmToMeters(door.height);

		let position01 = door.position;
		if (flipAlongLength) {
			position01 = 1 - position01;
		}
		const centerX = position01 * wallLength - wallLength / 2;

		const cutXStart = centerX - widthMeters / 2;
		const cutXEnd = centerX + widthMeters / 2;

		const cutYBottom = 0;
		const cutYTop = Math.min(heightMeters, wallHeight);

		if (cutXStart < wallLength / 2 && cutXEnd > -wallLength / 2) {
			cuts.push({
				wallId,
				xStart: Math.max(cutXStart, -wallLength / 2),
				xEnd: Math.min(cutXEnd, wallLength / 2),
				yBottom: cutYBottom,
				yTop: cutYTop,
			});
		}
	}

	return cuts;
}

interface DoorMeshProps {
	door: Door;
	basis: WallBasis;
	layers: Map<string, Layer>;
}

/**
 * Вычисляет позицию pivot (петель) двери в локальной системе координат стены
 * @param hingeSide - сторона петель ("left" или "right")
 * @param doorWidth - ширина двери в метрах
 * @returns координата X pivot в локальной системе стены
 */
function computeDoorPivotX(
	hingeSide: "left" | "right",
	doorWidth: number
): number {
	// Если петли слева - pivot на левом краю полотна
	// Если петли справа - pivot на правом краю полотна
	return hingeSide === "left" ? -doorWidth / 2 : doorWidth / 2;
}

/**
 * Вычисляет целевой угол открытия двери на основе hingeSide и swingDirection
 * @param hingeSide - сторона петель
 * @param swingDirection - направление открытия (inside/outside)
 * @param isOpen - открыта ли дверь
 * @returns угол в радианах (0 если закрыта)
 */
function computeDoorTargetAngle(
	hingeSide: "left" | "right",
	swingDirection: "inside" | "outside",
	isOpen: boolean
): number {
	if (!isOpen) return 0;

	// Определяем знак угла на основе комбинации hingeSide и swingDirection
	// Для согласованности с 2D: если петли слева и открывается внутрь - положительный угол
	// Если петли справа и открывается внутрь - отрицательный угол
	// Для "outside" - противоположный знак

	let baseAngle: number;
	if (hingeSide === "left") {
		baseAngle = swingDirection === "inside" ? Math.PI / 2 : -Math.PI / 2;
	} else {
		// hingeSide === "right"
		baseAngle = swingDirection === "inside" ? -Math.PI / 2 : Math.PI / 2;
	}

	return baseAngle;
}

function DoorMesh({ door, basis, layers }: DoorMeshProps) {
	const [openState, setOpenState] = useState<DoorOpenState>(
		DoorOpenState.Closed
	);
	const currentAngleRef = useRef(0);
	const targetAngleRef = useRef(0);
	const pivotGroupRef = useRef<Group>(null);

	const { registerInteractiveObject, unregisterInteractiveObject } =
		useEditor3DInteraction();

	// Нормализуем ориентацию двери (миграция со старого формата)
	const { hingeSide, swingDirection } = normalizeDoorOrientation(door);

	const doorWidth = mmToMeters(door.width);
	const doorHeight = mmToMeters(door.height);

	let position01 = door.position;
	if (basis.flipAlongLength) {
		position01 = 1 - position01;
	}
	const localCenterX = position01 * basis.length - basis.length / 2;
	const localY = doorHeight / 2 + DOOR_FLOOR_GAP;
	const localZ = basis.thickness / 2 + DOOR_THICKNESS / 2 + 0.001;

	const worldPosition = useMemo(() => {
		const localPos = new THREE_Vector3(localCenterX, localY, localZ);
		const rotated = new THREE_Vector3()
			.addScaledVector(basis.basis.xAxis, localPos.x)
			.addScaledVector(basis.basis.yAxis, localPos.y)
			.addScaledVector(basis.basis.zAxis, localPos.z);
		return basis.basis.origin.clone().add(rotated);
	}, [basis, localCenterX, localY, localZ]);

	const pivotX = useMemo(() => {
		return computeDoorPivotX(hingeSide, doorWidth);
	}, [hingeSide, doorWidth]);

	// Вычисляем целевой угол при изменении состояния
	useEffect(() => {
		const isOpen = openState === DoorOpenState.Open;
		targetAngleRef.current = computeDoorTargetAngle(
			hingeSide,
			swingDirection,
			isOpen
		);
	}, [openState, hingeSide, swingDirection]);

	// Плавная анимация открытия/закрытия
	useFrame((_, delta) => {
		const current = currentAngleRef.current;
		const target = targetAngleRef.current;
		const diff = target - current;

		if (Math.abs(diff) < 1e-3) {
			return;
		}

		const step = diff * delta * DOOR_OPEN_SPEED;
		currentAngleRef.current = current + step;

		if (pivotGroupRef.current) {
			pivotGroupRef.current.rotation.y = currentAngleRef.current;
		}
	});

	// Toggle функция для переключения состояния
	const toggle = useCallback(() => {
		setOpenState((prev) =>
			prev === DoorOpenState.Closed ? DoorOpenState.Open : DoorOpenState.Closed
		);
	}, []);

	// Регистрация в контекст взаимодействий
	const visibleLayer = isLayerVisible(door.layerId, layers);
	useEffect(() => {
		if (!visibleLayer) {
			return;
		}

		const handle = {
			id: door.id,
			type: "door" as const,
			toggle,
		};

		registerInteractiveObject(handle);

		return () => {
			unregisterInteractiveObject(door.id, "door");
		};
	}, [
		door.id,
		visibleLayer,
		toggle,
		registerInteractiveObject,
		unregisterInteractiveObject,
	]);

	const frameWidth = doorWidth + FRAME_WIDTH * 2;
	const frameHeight = doorHeight + FRAME_WIDTH * 2;

	// Не рендерим дверь, если слой невидим
	if (!visibleLayer) {
		return null;
	}

	return (
		<group position={worldPosition} rotation-y={basis.angleRad}>
			<group position={[pivotX, 0, -localZ + basis.thickness / 2]}>
				<group ref={pivotGroupRef}>
					<mesh
						position={[-pivotX, 0, 0]}
						castShadow
						receiveShadow
						onClick={toggle}
						userData={{
							objectId: door.id,
							objectType: "door",
						}}
					>
						<boxGeometry args={[doorWidth, doorHeight, DOOR_THICKNESS]} />
						<meshStandardMaterial
							color="#8b4513"
							roughness={0.8}
							metalness={0.1}
						/>
					</mesh>
					<mesh
						position={[
							-pivotX +
								(hingeSide === "left"
									? doorWidth / 2 - HANDLE_OFFSET_FROM_EDGE
									: -doorWidth / 2 + HANDLE_OFFSET_FROM_EDGE),
							doorHeight * HANDLE_HEIGHT_FACTOR - doorHeight / 2,
							DOOR_THICKNESS / 2 + HANDLE_LENGTH / 2,
						]}
						castShadow
					>
						<cylinderGeometry
							args={[HANDLE_RADIUS, HANDLE_RADIUS, HANDLE_LENGTH, 16]}
						/>
						<meshStandardMaterial
							color="#c0c0c0"
							roughness={0.3}
							metalness={0.8}
						/>
					</mesh>
				</group>
			</group>
			<group position={[0, 0, -localZ + basis.thickness / 2]}>
				<mesh
					position={[0, frameHeight / 2 - FRAME_WIDTH / 2, 0]}
					castShadow
					receiveShadow
				>
					<boxGeometry args={[frameWidth, FRAME_WIDTH, FRAME_DEPTH]} />
					<meshStandardMaterial
						color="#d4a574"
						roughness={0.7}
						metalness={0.0}
					/>
				</mesh>
				<mesh
					position={[0, -frameHeight / 2 + FRAME_WIDTH / 2, 0]}
					castShadow
					receiveShadow
				>
					<boxGeometry args={[frameWidth, FRAME_WIDTH, FRAME_DEPTH]} />
					<meshStandardMaterial
						color="#d4a574"
						roughness={0.7}
						metalness={0.0}
					/>
				</mesh>
				<mesh
					position={[-frameWidth / 2 + FRAME_WIDTH / 2, 0, 0]}
					castShadow
					receiveShadow
				>
					<boxGeometry args={[FRAME_WIDTH, frameHeight, FRAME_DEPTH]} />
					<meshStandardMaterial
						color="#d4a574"
						roughness={0.7}
						metalness={0.0}
					/>
				</mesh>
				<mesh
					position={[frameWidth / 2 - FRAME_WIDTH / 2, 0, 0]}
					castShadow
					receiveShadow
				>
					<boxGeometry args={[FRAME_WIDTH, frameHeight, FRAME_DEPTH]} />
					<meshStandardMaterial
						color="#d4a574"
						roughness={0.7}
						metalness={0.0}
					/>
				</mesh>
			</group>
		</group>
	);
}

export interface Doors3DProps {
	doors: Map<string, Door>;
	walls: Map<string, Wall>;
	nodes: Map<string, Node>;
	layers: Map<string, Layer>;
}

export function Doors3D({ doors, walls, nodes, layers }: Doors3DProps) {
	const doorInstances = useMemo(() => {
		const instances: Array<{ door: Door; basis: WallBasis }> = [];

		for (const door of doors.values()) {
			if (!isLayerVisible(door.layerId, layers)) {
				continue;
			}

			const wall = walls.get(door.wallId);
			if (!wall) {
				continue;
			}

			const basis = computeWallBasis(wall, nodes);
			if (!basis) {
				continue;
			}

			instances.push({ door, basis });
		}

		return instances;
	}, [doors, walls, nodes, layers]);

	return (
		<>
			{doorInstances.map(({ door, basis }) => (
				<DoorMesh key={door.id} door={door} basis={basis} layers={layers} />
			))}
		</>
	);
}
