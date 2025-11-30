"use client";

import { useMemo, memo, useState, useEffect } from "react";
import type { Texture } from "three";
import {
	Shape,
	ShapeGeometry,
	PlaneGeometry,
	RepeatWrapping,
	TextureLoader,
} from "three";
import type { Room, Layer } from "@/types/editor";
import { isLayerVisible } from "./utils3d";

/**
 * Пропсы компонента Rooms3D
 */
export interface Rooms3DProps {
	rooms: Map<string, Room>;
	layers: Map<string, Layer>;
}

/**
 * UserData для пола комнаты (для raycaster)
 */
interface RoomFloorUserData {
	objectId: string;
	objectType: "room";
}

/**
 * Дефолтный цвет пола, если не задан
 */
const DEFAULT_FLOOR_COLOR = "#3b82f6";

/**
 * Проверяет, является ли URL валидным для загрузки текстуры
 */
function isValidTextureUrl(url: string | null | undefined): boolean {
	if (!url || typeof url !== "string" || url.trim() === "") {
		return false;
	}

	// Проверяем, что это валидный URL (http, https, blob, data)
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
		// Если не удалось создать URL, это может быть относительный путь
		// Проверяем, что это не пустая строка
		return url.trim().length > 0;
	}
}

/**
 * Компонент для загрузки и настройки текстуры
 */
function useRoomTexture(textureUrl: string | null | undefined): Texture | null {
	const [texture, setTexture] = useState<Texture | null>(null);

	useEffect(() => {
		// Проверяем валидность URL перед загрузкой
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
				// Тихо обрабатываем ошибку без вывода в консоль
				// Текстура просто не будет загружена, и будет использован цвет по умолчанию
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
 * Компонент для рендеринга пола одной комнаты
 */
function RoomFloorMesh({ room }: { room: Room }) {
	// Вычисляем геометрию пола
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

			// Создаём Shape со смещенными координатами (относительно центроида)
			// Shape работает в плоскости XY, где Y - это "вверх" в локальной системе
			// После поворота на -90° вокруг X: Y из Shape станет -Z в 3D
			// Поэтому используем отрицательный Y, чтобы получить правильный Z
			const shape = new Shape();
			const firstPoint = room.polygon[0];
			shape.moveTo(firstPoint.x - centroidX, -(firstPoint.y - centroidZ));

			for (let i = 1; i < room.polygon.length; i++) {
				const point = room.polygon[i];
				shape.lineTo(point.x - centroidX, -(point.y - centroidZ));
			}

			shape.lineTo(firstPoint.x - centroidX, -(firstPoint.y - centroidZ)); // Замыкаем полигон

			return new ShapeGeometry(shape);
		} else {
			// Прямоугольная комната - используем PlaneGeometry
			return new PlaneGeometry(room.size.width, room.size.height);
		}
	}, [room.polygon, room.size.width, room.size.height]);

	// Загружаем текстуру, если нужно
	const baseTexture = useRoomTexture(
		room.floorFillMode === "texture" ? room.floorTexture : null
	);

	// Настраиваем текстуру с масштабом
	const configuredTexture = useMemo(() => {
		if (room.floorFillMode === "texture" && room.floorTexture && baseTexture) {
			const scaleX = room.floorTextureScale?.x ?? 1;
			const scaleY = room.floorTextureScale?.y ?? 1;
			baseTexture.repeat.set(scaleX, scaleY);
			baseTexture.needsUpdate = true;
			return baseTexture;
		}
		return null;
	}, [
		baseTexture,
		room.floorFillMode,
		room.floorTexture,
		room.floorTextureScale,
	]);

	// Вычисляем позицию и поворот
	// В 3D: node.x -> x, node.y -> z (Y в 3D всегда 0.01 для пола)
	const { position, rotation } = useMemo(() => {
		if (room.polygon && room.polygon.length >= 3) {
			// Для полигональной комнаты вычисляем центроид
			// polygon содержит координаты в метрах: x (2D) -> x (3D), y (2D) -> z (3D)
			let sumX = 0;
			let sumZ = 0;
			for (const point of room.polygon) {
				sumX += point.x; // x в 2D = x в 3D
				sumZ += point.y; // y в 2D = z в 3D
			}
			const centroidX = sumX / room.polygon.length;
			const centroidZ = sumZ / room.polygon.length;

			return {
				position: [centroidX, 0.02, centroidZ] as [number, number, number],
				rotation: [0, 0, 0] as [number, number, number],
			};
		} else {
			// Для прямоугольной комнаты: position - это левый верхний угол в 2D
			// position.x (2D) -> x (3D), position.y (2D) -> z (3D)
			// Нужно вычислить центр комнаты
			const centerX = room.position.x + room.size.width / 2;
			const centerZ = room.position.y + room.size.height / 2;
			const rotationRad = (room.rotation * Math.PI) / 180;

			return {
				position: [centerX, 0.02, centerZ] as [number, number, number],
				rotation: [0, rotationRad, 0] as [number, number, number],
			};
		}
	}, [room.polygon, room.position, room.size, room.rotation]);

	// Поворачиваем геометрию на -90 градусов вокруг X, чтобы пол лежал горизонтально
	const floorRotation: [number, number, number] = [
		-Math.PI / 2,
		rotation[1],
		rotation[2],
	];

	return (
		<mesh
			key={`${room.id}-${room.floorFillMode}-${
				room.floorTexture || room.floorColor
			}`}
			geometry={geometry}
			position={position}
			rotation={floorRotation}
			receiveShadow
			userData={
				{
					objectId: room.id,
					objectType: "room",
				} as RoomFloorUserData
			}
		>
			{configuredTexture ? (
				<meshStandardMaterial
					key={`texture-${room.id}-${room.floorTexture}`}
					map={configuredTexture}
					transparent={false}
					opacity={1}
					roughness={0.9}
					metalness={0.0}
				/>
			) : (
				<meshStandardMaterial
					key={`color-${room.id}-${room.floorColor ?? DEFAULT_FLOOR_COLOR}`}
					color={room.floorColor ?? DEFAULT_FLOOR_COLOR}
					transparent={false}
					opacity={1}
				/>
			)}
		</mesh>
	);
}

/**
 * Компонент для рендеринга всех полов комнат в 3D сцене
 */
export const Rooms3D = memo(function Rooms3D({ rooms, layers }: Rooms3DProps) {
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
				<RoomFloorMesh key={room.id} room={room} />
			))}
		</>
	);
});
