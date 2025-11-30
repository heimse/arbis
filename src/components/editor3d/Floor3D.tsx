"use client";

import { useMemo } from "react";
import { MeshStandardMaterial, PlaneGeometry } from "three";

export interface Floor3DProps {
	bounds: {
		minX: number;
		maxX: number;
		minZ: number;
		maxZ: number;
		centerX: number;
		centerZ: number;
	};
}

/**
 * Компонент пола для 3D-сцены планировки
 * Пол покрывает всю видимую область с запасом вокруг планировки
 */
export function Floor3D({ bounds }: Floor3DProps) {
	const { geometry, material, position } = useMemo(() => {
		// Вычисляем базовые размеры планировки
		const baseWidth = bounds.maxX - bounds.minX;
		const baseDepth = bounds.maxZ - bounds.minZ;

		// Если план пустой (очень маленькие размеры), используем дефолтный размер 20x20
		const DEFAULT_FLOOR_SIZE = 20;
		if (baseWidth < 15 && baseDepth < 15) {
			const width = DEFAULT_FLOOR_SIZE;
			const depth = DEFAULT_FLOOR_SIZE;

			const floorGeometry = new PlaneGeometry(width, depth);
			const floorMaterial = new MeshStandardMaterial({
				color: "#f1f5f9",
				roughness: 0.95,
				metalness: 0,
			});
			const floorPosition: [number, number, number] = [
				bounds.centerX,
				0,
				bounds.centerZ,
			];

			return {
				geometry: floorGeometry,
				material: floorMaterial,
				position: floorPosition,
			};
		}

		// Вычисляем padding (25% от максимального размера, минимум 2-3 метра)
		const maxDimension = Math.max(baseWidth, baseDepth);
		const padding = Math.max(maxDimension * 0.25, 3);

		// Итоговые размеры пола
		const width = baseWidth + padding * 2;
		const depth = baseDepth + padding * 2;

		// Создаём геометрию плоскости
		const floorGeometry = new PlaneGeometry(width, depth);

		// Создаём материал пола
		const floorMaterial = new MeshStandardMaterial({
			color: "#f1f5f9",
			roughness: 0.95,
			metalness: 0,
		});

		// Позиция пола (центр планировки на уровне Y=0)
		const floorPosition: [number, number, number] = [
			bounds.centerX,
			0,
			bounds.centerZ,
		];

		return {
			geometry: floorGeometry,
			material: floorMaterial,
			position: floorPosition,
		};
	}, [bounds]);

	return (
		<mesh
			geometry={geometry}
			material={material}
			position={position}
			rotation={[-Math.PI / 2, 0, 0]}
			receiveShadow
		/>
	);
}

