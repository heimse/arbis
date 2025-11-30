"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import type { Group, Mesh } from "three";
import { Box3, Vector3 } from "three";

export interface FurnitureModelProps {
	modelPath: string;
	footprint: { width: number; depth: number }; // целевой footprint в метрах по X/Z, из 2D-плана
	targetHeight?: number; // желаемая высота (если есть, иначе использовать исходную)
	position: [number, number, number]; // мировые координаты (метры)
	rotationY: number; // радианы, поворот вокруг Y
	userData?: Record<string, unknown>; // для raycaster'а (id/type)
}

/**
 * Нормализует pivot и масштабирует модель под заданный footprint
 */
function normalizeAndScaleModel(
	cloned: Group,
	footprint: { width: number; depth: number },
	targetHeight?: number
): void {
	// Вычисляем bounding box
	const bbox = new Box3();
	bbox.setFromObject(cloned);

	// Получаем размеры и центр
	const size = new Vector3();
	bbox.getSize(size);

	const center = new Vector3();
	bbox.getCenter(center);

	// Сдвигаем модель так, чтобы:
	// - центр по X/Z оказался в (0,0)
	// - низ модели (yMin) оказался на 0 (модель стоит на полу)
	const offset = new Vector3(-center.x, -bbox.min.y, -center.z);
	cloned.position.copy(offset);

	// Исходный footprint модели
	const originalWidth = size.x;
	const originalDepth = size.z;

	// Вычисляем масштаб по X и Z для соответствия целевому footprint
	const scaleX = footprint.width / originalWidth;
	const scaleZ = footprint.depth / originalDepth;

	// Масштаб по Y
	let scaleY: number;
	if (targetHeight !== undefined) {
		scaleY = targetHeight / size.y;
	} else {
		// Используем среднее от scaleX и scaleZ для сохранения пропорций
		scaleY = (scaleX + scaleZ) / 2;
	}

	// Применяем масштаб
	cloned.scale.set(scaleX, scaleY, scaleZ);

	// Включаем тени для всех мешей в сцене
	cloned.traverse((child) => {
		if (child.type === "Mesh") {
			const mesh = child as Mesh;
			mesh.castShadow = true;
			mesh.receiveShadow = true;
		}
	});
}

/**
 * Низкоуровневый компонент для загрузки и отображения GLB модели мебели
 * Нормализует pivot, масштабирует под footprint, включает тени
 */
export function FurnitureModel({
	modelPath,
	footprint,
	targetHeight,
	position,
	rotationY,
	userData,
}: FurnitureModelProps) {
	// Загружаем модель
	const { scene } = useGLTF(modelPath);

	// Клонируем сцену для каждого экземпляра, чтобы не портить оригинал
	const cloned = useMemo(() => {
		const clonedScene = scene.clone(true);
		normalizeAndScaleModel(clonedScene, footprint, targetHeight);
		return clonedScene;
	}, [scene, footprint.width, footprint.depth, targetHeight]);

	return (
		<group position={position} rotation={[0, rotationY, 0]} userData={userData}>
			<primitive object={cloned} />
		</group>
	);
}

/**
 * Предзагрузка всех моделей мебели из каталога
 * Вызывать в компоненте верхнего уровня для оптимизации
 * @param modelPaths - массив путей к GLB моделям
 */
export function preloadFurnitureModels(modelPaths: string[]): void {
	// Предзагружаем все модели
	for (const path of modelPaths) {
		useGLTF.preload(path);
	}
}
