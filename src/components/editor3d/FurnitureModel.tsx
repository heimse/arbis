"use client";

import React, { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

interface FurnitureModelProps {
	modelPath: string;
	position?: [number, number, number];
	rotation?: [number, number, number];
	scale?: number | [number, number, number];
	userData?: Record<string, any>;
}

/**
 * Компонент для загрузки и отображения GLB модели мебели
 */
export function FurnitureModel({
	modelPath,
	position = [0, 0, 0],
	rotation = [0, 0, 0],
	scale = 1,
	userData,
}: FurnitureModelProps) {
	const { scene } = useGLTF(modelPath);

	// Клонируем сцену для использования
	const clonedScene = useMemo(() => {
		const cloned = scene.clone();

		// Применяем userData ко всем мешам
		cloned.traverse((child) => {
			if (child instanceof THREE.Mesh) {
				if (userData) {
					child.userData = { ...child.userData, ...userData };
				}
				// Включаем тени
				child.castShadow = true;
				child.receiveShadow = true;
			}
		});

		return cloned;
	}, [scene, userData]);

	return (
		<primitive
			object={clonedScene}
			position={position}
			rotation={rotation}
			scale={scale}
		/>
	);
}

// Предзагрузка моделей для оптимизации
// Используйте этот хук в компоненте для предзагрузки
export function usePreloadFurnitureModels(modelPaths: string[]) {
	React.useEffect(() => {
		modelPaths.forEach((path) => {
			useGLTF.preload(path);
		});
	}, [modelPaths]);
}
