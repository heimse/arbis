"use client";

import { useMemo, memo } from "react";
import type { Furniture, Layer } from "@/types/editor";
import { isLayerVisible } from "./utils3d";
import {
	getFurnitureItemByType,
	getFurnitureItemById,
} from "./furnitureCatalog";
import { FurnitureModel } from "./FurnitureModel";
import {
	findCatalogItem,
	defaultFurnitureCatalog,
} from "@/lib/editor/furnitureCatalog";

export interface Furniture3DProps {
	furniture: Map<string, Furniture>;
	layers: Map<string, Layer>;
}

/**
 * Цвета для fallback Box по типу мебели
 */
function getFurnitureColorByType(type: string): string {
	const normalizedType = type.toLowerCase();
	if (normalizedType.includes("sofa")) {
		return "#8b4513"; // коричневый
	}
	if (normalizedType.includes("bed")) {
		return "#4a5568"; // тёмно-серый
	}
	if (normalizedType.includes("table")) {
		return "#d4a574"; // бежевый
	}
	if (normalizedType.includes("chair")) {
		return "#654321"; // тёмно-коричневый
	}
	if (
		normalizedType.includes("wardrobe") ||
		normalizedType.includes("cabinet") ||
		normalizedType.includes("hauga") ||
		normalizedType.includes("kleppstad")
	) {
		return "#2c3e50"; // тёмно-синий
	}
	return "#718096"; // серый по умолчанию
}

/**
 * Компонент для отображения fallback Box, когда модель не найдена
 */
function FurnitureFallbackBox({
	item,
	position,
	rotationY,
	width,
	depth,
	height,
}: {
	item: Furniture;
	position: [number, number, number];
	rotationY: number;
	width: number;
	depth: number;
	height: number;
}) {
	const color = getFurnitureColorByType(item.type);

	return (
		<mesh
			position={position}
			rotation={[0, rotationY, 0]}
			castShadow
			receiveShadow
			userData={{
				objectId: item.id,
				objectType: "furniture",
			}}
		>
			<boxGeometry args={[width, height, depth]} />
			<meshStandardMaterial color={color} roughness={0.7} metalness={0.1} />
		</mesh>
	);
}

/**
 * Высокоуровневый компонент для отображения всей мебели из EditorState
 * Позиционирует мебель точно по 2D-плану, использует модели из каталога или fallback Box
 */
export const Furniture3D = memo(function Furniture3D({
	furniture,
	layers,
}: Furniture3DProps) {
	// Фильтруем видимую мебель
	const visibleItems = useMemo(() => {
		const items: Furniture[] = [];

		for (const item of furniture.values()) {
			// Проверяем видимость слоя
			if (!isLayerVisible(item.layerId, layers)) {
				continue;
			}

			items.push(item);
		}

		return items;
	}, [furniture, layers]);

	// Вычисляем данные для каждого элемента мебели
	const furnitureElements = useMemo(() => {
		return visibleItems.map((item) => {
			// Позиция в 3D: 2D position.x -> 3D x, 2D position.y -> 3D z
			// Y = 0.02 (немного выше пола, чтобы избежать z-fighting с Rooms3D на Y=0.02)
			const x = item.position.x;
			const z = item.position.y;
			const yBase = 0.02;

			// Footprint из 2D: width -> X, height -> Z (глубина)
			const width = item.size.width;
			const depth = item.size.height; // в 2D это height, но в 3D это глубина (Z)

			// Высота
			const targetHeight = item.height;

			// Поворот: градусы -> радианы
			const rotationY = (item.rotation * Math.PI) / 180;

			// Ищем модель в каталогах
			// Сначала пробуем найти в каталоге 3D по id или category
			let catalogItem = getFurnitureItemByType(item.type);

			// Если не найдено, пробуем найти в старом каталоге 2D
			if (!catalogItem) {
				// Пробуем найти по ID
				let oldCatalogItem = findCatalogItem(item.type);

				// Если не найдено по ID, пробуем найти по названию
				if (!oldCatalogItem) {
					oldCatalogItem = defaultFurnitureCatalog.find(
						(catItem) => catItem.name === item.type
					);
				}

				if (oldCatalogItem?.modelPath) {
					// Конвертируем старый формат каталога в новый
					catalogItem = {
						id: oldCatalogItem.id,
						name: oldCatalogItem.name,
						category: oldCatalogItem.category,
						modelPath: oldCatalogItem.modelPath,
						defaultFootprint: {
							width: oldCatalogItem.defaultSize.width / 1000, // мм -> метры
							depth: oldCatalogItem.defaultSize.depth / 1000, // мм -> метры
						},
						defaultHeight: oldCatalogItem.defaultSize.height
							? oldCatalogItem.defaultSize.height / 1000
							: undefined,
					};
				}
			}

			// userData для raycaster
			const userData = {
				objectId: item.id,
				objectType: "furniture" as const,
			};

			return {
				item,
				catalogItem,
				position: [x, yBase, z] as [number, number, number],
				rotationY,
				width,
				depth,
				targetHeight,
				userData,
			};
		});
	}, [visibleItems]);

	return (
		<>
			{furnitureElements.map(
				({
					item,
					catalogItem,
					position,
					rotationY,
					width,
					depth,
					targetHeight,
					userData,
				}) => {
					// Если модель найдена в каталоге
					if (catalogItem) {
						return (
							<FurnitureModel
								key={item.id}
								modelPath={catalogItem.modelPath}
								footprint={{ width, depth }}
								targetHeight={targetHeight ?? catalogItem.defaultHeight}
								position={position}
								rotationY={rotationY}
								userData={userData}
							/>
						);
					}

					// Fallback: простой Box
					const fallbackHeight = targetHeight ?? 0.75; // дефолтная высота 0.75м
					return (
						<FurnitureFallbackBox
							key={item.id}
							item={item}
							position={position}
							rotationY={rotationY}
							width={width}
							depth={depth}
							height={fallbackHeight}
						/>
					);
				}
			)}
		</>
	);
});
