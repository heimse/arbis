import React, { useMemo } from "react";
import { Room, Layer } from "@/types/editor";
import * as THREE from "three";
import { Shape } from "three";

interface Rooms3DProps {
	rooms: Room[];
	layers: Map<string, Layer>;
}

/**
 * Компонент для отрисовки комнат в 3D
 */
export function Rooms3D({ rooms, layers }: Rooms3DProps) {
	return (
		<>
			{rooms.map((room) => {
				const layer = layers.get(room.layerId);
				if (!layer || !layer.visible) return null;

				return <Room3D key={room.id} room={room} layer={layer} />;
			})}
		</>
	);
}

interface Room3DProps {
	room: Room;
	layer: Layer;
}

function Room3D({ room, layer }: Room3DProps) {
	// Создаем геометрию из полигона комнаты
	const geometry = useMemo(() => {
		if (!room.polygon || room.polygon.length < 3) {
			// Если нет полигона, используем простой прямоугольник
			const width = room.size.width;
			const depth = room.size.height;
			return {
				shape: null,
				position: [
					room.position.x + width / 2,
					0.005,
					room.position.y + depth / 2,
				] as [number, number, number],
				rotation: [-Math.PI / 2, 0, (room.rotation * Math.PI) / 180] as [
					number,
					number,
					number
				],
				size: [width, depth] as [number, number],
			};
		}

		// Создаем Shape из полигона
		const shape = new Shape();
		room.polygon.forEach((point, index) => {
			if (index === 0) {
				shape.moveTo(point.x, point.y);
			} else {
				shape.lineTo(point.x, point.y);
			}
		});
		shape.closePath();

		return {
			shape,
			position: [0, 0.005, 0] as [number, number, number],
			rotation: [-Math.PI / 2, 0, 0] as [number, number, number],
			size: null,
		};
	}, [room]);

	// Цвет комнаты - пастельный оттенок на основе ID комнаты
	// Генерируем уникальный, но мягкий цвет для каждой комнаты
	const roomColor = useMemo(() => {
		// Используем хэш от ID комнаты для генерации уникального цвета
		const hash = room.id.split("").reduce((acc, char) => {
			return char.charCodeAt(0) + ((acc << 5) - acc);
		}, 0);

		const hue = Math.abs(hash % 360);
		// Более мягкие, пастельные тона
		return `hsl(${hue}, 40%, 80%)`;
	}, [room.id]);

	if (geometry.shape) {
		// Комната с произвольным полигоном
		return (
			<mesh
				position={geometry.position}
				rotation={geometry.rotation}
				receiveShadow
				userData={{ objectId: room.id, objectType: "room" }}
			>
				<shapeGeometry args={[geometry.shape]} />
				<meshStandardMaterial
					color={roomColor}
					roughness={0.95}
					metalness={0.0}
					transparent
					opacity={0.5}
				/>
			</mesh>
		);
	} else if (geometry.size) {
		// Простой прямоугольник
		return (
			<mesh
				position={geometry.position}
				rotation={geometry.rotation}
				receiveShadow
				userData={{ objectId: room.id, objectType: "room" }}
			>
				<planeGeometry args={geometry.size} />
				<meshStandardMaterial
					color={roomColor}
					roughness={0.95}
					metalness={0.0}
					transparent
					opacity={0.5}
				/>
			</mesh>
		);
	}

	return null;
}
