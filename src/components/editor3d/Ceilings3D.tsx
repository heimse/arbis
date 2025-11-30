"use client";

import { useMemo, memo, useState, useEffect } from "react";
import type { Texture } from "three";
import {
	Shape,
	ShapeGeometry,
	PlaneGeometry,
	RepeatWrapping,
	TextureLoader,
	DoubleSide,
} from "three";
import type { Room, Wall, Layer } from "@/types/editor";
import { isLayerVisible, DEFAULT_WALL_HEIGHT } from "./utils3d";

/**
 * Пропсы компонента Ceilings3D
 */
export interface Ceilings3DProps {
	rooms: Map<string, Room>;
	walls: Map<string, Wall>;
	layers: Map<string, Layer>;
}

/**
 * UserData для потолка комнаты (для raycaster)
 */
interface CeilingUserData {
	objectId: string;
	objectType: "ceiling";
}

/**
 * Дефолтный цвет потолка, если не задан
 */
const DEFAULT_CEILING_COLOR = "#f3f4f6";

/**
 * Проверяет, является ли URL валидным для загрузки текстуры
 */
function isValidTextureUrl(url: string | null | undefined): boolean {
	if (!url || typeof url !== "string" || url.trim() === "") {
		return false;
	}

	try {
		const urlObj = new URL(url, window.location.href);
		const protocol = urlObj.protocol;
		return (
			protocol === "http:" ||
			protocol === "https:" ||
			protocol === "blob:" ||
			protocol === "data:"
		);
	} catch {
		return url.trim().length > 0;
	}
}

/**
 * Компонент для загрузки и настройки текстуры потолка
 */
function useCeilingTexture(
	textureUrl: string | null | undefined
): Texture | null {
	const [texture, setTexture] = useState<Texture | null>(null);

	useEffect(() => {
		if (!isValidTextureUrl(textureUrl)) {
			setTexture(null);
			return;
		}

		let isCancelled = false;
		const loader = new TextureLoader();

		loader.load(
			textureUrl!,
			(loadedTexture) => {
				if (isCancelled) {
					loadedTexture.dispose();
					return;
				}

				loadedTexture.wrapS = RepeatWrapping;
				loadedTexture.wrapT = RepeatWrapping;
				loadedTexture.needsUpdate = true;
				setTexture(loadedTexture);
			},
			undefined,
			(error) => {
				if (!isCancelled) {
					setTexture(null);
				}
			}
		);

		return () => {
			isCancelled = true;
			setTexture((prevTexture) => {
				if (prevTexture) {
					prevTexture.dispose();
				}
				return null;
			});
		};
	}, [textureUrl]);

	return texture;
}

/**
 * Вычисляет максимальную высоту стен в сцене
 */
function computeMaxWallHeight(walls: Map<string, Wall>): number {
	let maxHeight = DEFAULT_WALL_HEIGHT;

	for (const wall of walls.values()) {
		const wallHeight = wall.height ?? DEFAULT_WALL_HEIGHT;
		maxHeight = Math.max(maxHeight, wallHeight);
	}

	return maxHeight;
}

/**
 * Компонент для рендеринга потолка одной комнаты
 */
function CeilingMesh({ room, ceilingY }: { room: Room; ceilingY: number }) {
	// Вычисляем геометрию потолка
	const geometry = useMemo(() => {
		if (room.polygon && room.polygon.length >= 3) {
			// Полигональная комната - создаём Shape из полигона
			// Вычисляем центроид для смещения координат
			let sumX = 0;
			let sumZ = 0;
			for (const point of room.polygon) {
				sumX += point.x; // x в 2D = x в 3D
				sumZ += point.y; // y в 2D = z в 3D
			}
			const centroidX = sumX / room.polygon.length;
			const centroidZ = sumZ / room.polygon.length;

			// Создаём Shape в плоскости XZ
			// Shape работает в плоскости XY, где Y - это "вверх" в локальной системе
			// После поворота на 90° вокруг X: Y из Shape станет Z в 3D
			const shape = new Shape();
			const firstPoint = room.polygon[0];
			shape.moveTo(firstPoint.x - centroidX, firstPoint.y - centroidZ);

			for (let i = 1; i < room.polygon.length; i++) {
				const point = room.polygon[i];
				shape.lineTo(point.x - centroidX, point.y - centroidZ);
			}

			shape.lineTo(firstPoint.x - centroidX, firstPoint.y - centroidZ); // Замыкаем полигон

			return new ShapeGeometry(shape);
		} else {
			// Прямоугольная комната - используем PlaneGeometry
			return new PlaneGeometry(room.size.width, room.size.height);
		}
	}, [room.polygon, room.size.width, room.size.height]);

	// Загружаем текстуру, если нужно
	const baseTexture = useCeilingTexture(
		room.ceilingFillMode === "texture" ? room.ceilingTexture : null
	);

	// Настраиваем текстуру с масштабом
	const configuredTexture = useMemo(() => {
		if (
			room.ceilingFillMode === "texture" &&
			room.ceilingTexture &&
			baseTexture
		) {
			const scaleX = room.ceilingTextureScale?.x ?? 1;
			const scaleY = room.ceilingTextureScale?.y ?? 1;
			baseTexture.repeat.set(scaleX, scaleY);
			baseTexture.needsUpdate = true;
			return baseTexture;
		}
		return null;
	}, [
		baseTexture,
		room.ceilingFillMode,
		room.ceilingTexture,
		room.ceilingTextureScale,
	]);

	// Вычисляем позицию и поворот
	const { position, rotation } = useMemo(() => {
		if (room.polygon && room.polygon.length >= 3) {
			// Для полигональной комнаты вычисляем центроид
			let sumX = 0;
			let sumZ = 0;
			for (const point of room.polygon) {
				sumX += point.x;
				sumZ += point.y;
			}
			const centroidX = sumX / room.polygon.length;
			const centroidZ = sumZ / room.polygon.length;

			return {
				position: [centroidX, ceilingY, centroidZ] as [number, number, number],
				rotation: [Math.PI / 2, 0, 0] as [number, number, number], // Поворот на 90° вокруг X, чтобы нормаль смотрела вниз
			};
		} else {
			// Для прямоугольной комнаты
			const centerX = room.position.x + room.size.width / 2;
			const centerZ = room.position.y + room.size.height / 2;
			const rotationRad = (room.rotation * Math.PI) / 180;

			return {
				position: [centerX, ceilingY, centerZ] as [number, number, number],
				rotation: [Math.PI / 2, rotationRad, 0] as [number, number, number], // Поворот на 90° вокруг X + поворот комнаты вокруг Y
			};
		}
	}, [room.polygon, room.position, room.size, room.rotation, ceilingY]);

	// Определяем материал в зависимости от режима
	const ceilingColor = room.ceilingColor ?? DEFAULT_CEILING_COLOR;
	const fillMode = room.ceilingFillMode ?? "color";
	const lightIntensity = room.ceilingLightIntensity ?? 0;

	return (
		<mesh
			key={`${room.id}-ceiling-${fillMode}-${
				room.ceilingTexture || ceilingColor
			}`}
			geometry={geometry}
			position={position}
			rotation={rotation}
			receiveShadow={false}
			castShadow={false}
			userData={
				{
					objectId: room.id,
					objectType: "ceiling",
				} as CeilingUserData
			}
		>
			{fillMode === "texture" && configuredTexture ? (
				<meshStandardMaterial
					key={`texture-${room.id}-${room.ceilingTexture}`}
					map={configuredTexture}
					color={ceilingColor}
					transparent={false}
					opacity={1}
					roughness={0.9}
					metalness={0.0}
					side={DoubleSide}
				/>
			) : fillMode === "light" ? (
				<meshStandardMaterial
					key={`light-${room.id}-${ceilingColor}-${lightIntensity}`}
					color={ceilingColor}
					emissive={ceilingColor}
					emissiveIntensity={lightIntensity}
					transparent={false}
					opacity={1}
					roughness={0.6}
					metalness={0.0}
					side={DoubleSide}
				/>
			) : (
				<meshStandardMaterial
					key={`color-${room.id}-${ceilingColor}`}
					color={ceilingColor}
					transparent={false}
					opacity={1}
					roughness={0.9}
					metalness={0.0}
					side={DoubleSide}
				/>
			)}
		</mesh>
	);
}

/**
 * Компонент для рендеринга всех потолков комнат в 3D сцене
 */
export const Ceilings3D = memo(function Ceilings3D({
	rooms,
	walls,
	layers,
}: Ceilings3DProps) {
	// Вычисляем максимальную высоту стен
	const maxWallHeight = useMemo(() => {
		return computeMaxWallHeight(walls);
	}, [walls]);

	// Высота потолка = максимальная высота стен
	const ceilingY = maxWallHeight;

	// Фильтруем видимые комнаты
	const visibleRooms = useMemo(() => {
		const visible: Room[] = [];

		for (const room of rooms.values()) {
			if (isLayerVisible(room.layerId, layers)) {
				visible.push(room);
			}
		}

		return visible;
	}, [rooms, layers]);

	return (
		<>
			{visibleRooms.map((room) => (
				<CeilingMesh key={room.id} room={room} ceilingY={ceilingY} />
			))}
		</>
	);
});
