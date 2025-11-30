import React, { useMemo } from "react";
import { Furniture, Layer } from "@/types/editor";
import { FurnitureModel } from "./FurnitureModel";
import { getFurnitureById } from "./furnitureCatalog";
import { findCatalogItem } from "@/lib/editor/furnitureCatalog";

interface Furniture3DProps {
	furniture: Furniture[];
	layers: Map<string, Layer>;
	furnitureCatalog?: any[]; // каталог из 2D редактора (опционально)
}

/**
 * Компонент для отрисовки мебели в 3D
 * Простая визуализация как Box-ы с базовыми цветами по типу
 */
export function Furniture3D({
	furniture,
	layers,
	furnitureCatalog,
}: Furniture3DProps) {
	return (
		<>
			{furniture.map((item) => {
				const layer = layers.get(item.layerId);
				if (!layer || !layer.visible) return null;

				return (
					<FurnitureItem3D
						key={item.id}
						furniture={item}
						furnitureCatalog={furnitureCatalog}
					/>
				);
			})}
		</>
	);
}

interface FurnitureItem3DProps {
	furniture: Furniture;
	furnitureCatalog?: any[];
}

function FurnitureItem3D({
	furniture,
	furnitureCatalog,
}: FurnitureItem3DProps) {
	// Позиция мебели
	const position: [number, number, number] = [
		furniture.position.x,
		0, // будет скорректировано в зависимости от модели
		furniture.position.y, // node.y -> Z в 3D
	];

	// Поворот мебели
	const rotation = (furniture.rotation * Math.PI) / 180;

	// Размеры мебели из 2D плана (в метрах)
	const planWidth = furniture.size.width;
	const planDepth = furniture.size.height; // в 2D height = глубина в 3D
	const planHeight = furniture.height || 0.5; // высота по умолчанию

	// Пытаемся найти мебель в каталоге из 2D редактора
	const catalogItem2D = useMemo(() => {
		if (furniture.type && furnitureCatalog) {
			return findCatalogItem(furniture.type, furnitureCatalog);
		}
		return null;
	}, [furniture.type, furnitureCatalog]);

	// Если есть модель из каталога 2D редактора, используем её с масштабированием
	if (catalogItem2D && catalogItem2D.modelPath && catalogItem2D.modelSize) {
		const modelSize = catalogItem2D.modelSize;

		// Вычисляем масштаб на основе размеров из 2D плана и размеров модели
		const scaleX = planWidth / modelSize.width;
		const scaleZ = planDepth / modelSize.depth;
		const scaleY = planHeight / modelSize.height;

		// Используем средний масштаб для сохранения пропорций или отдельные масштабы
		// Для лучшего соответствия используем отдельные масштабы по осям
		const scale: [number, number, number] = [scaleX, scaleY, scaleZ];

		const modelHeight = modelSize.height * scaleY;
		return (
			<FurnitureModel
				modelPath={catalogItem2D.modelPath}
				position={[position[0], modelHeight / 2, position[2]]}
				rotation={[0, rotation, 0]}
				scale={scale}
				userData={{ objectId: furniture.id, objectType: "furniture" }}
			/>
		);
	}

	// Пытаемся найти мебель в каталоге 3D (fallback)
	const catalogItem3D = useMemo(() => {
		if (furniture.type) {
			return getFurnitureById(furniture.type);
		}
		return null;
	}, [furniture.type]);

	// Если есть модель из каталога 3D, используем её
	if (catalogItem3D && catalogItem3D.modelPath) {
		const modelSize = catalogItem3D.defaultSize;

		// Вычисляем масштаб
		const scaleX = planWidth / modelSize.width;
		const scaleZ = planDepth / modelSize.depth;
		const scaleY = planHeight / modelSize.height;
		const scale: [number, number, number] = [scaleX, scaleY, scaleZ];

		const modelHeight = modelSize.height * scaleY;
		return (
			<FurnitureModel
				modelPath={catalogItem3D.modelPath}
				position={[position[0], modelHeight / 2, position[2]]}
				rotation={[0, rotation, 0]}
				scale={scale}
				userData={{ objectId: furniture.id, objectType: "furniture" }}
			/>
		);
	}

	// Иначе используем простой Box (fallback)
	const width = furniture.size.width;
	const depth = furniture.size.height; // в 2D height = глубина в 3D
	const height = furniture.height || 0.5; // высота по умолчанию 0.5м

	// Цвет мебели в зависимости от типа
	const furnitureColor = useMemo(() => {
		const type = furniture.type.toLowerCase();

		if (type.includes("sofa") || type.includes("диван")) {
			return "#8b4513"; // коричневый для диванов
		}
		if (type.includes("bed") || type.includes("кровать")) {
			return "#4a5568"; // тёмно-серый для кроватей
		}
		if (type.includes("table") || type.includes("стол")) {
			return "#d4a574"; // бежевый для столов
		}
		if (type.includes("chair") || type.includes("стул")) {
			return "#654321"; // тёмно-коричневый для стульев
		}
		if (type.includes("cabinet") || type.includes("шкаф")) {
			return "#2c3e50"; // тёмно-синий для шкафов
		}

		// Цвет по умолчанию - нейтральный серый
		return "#718096";
	}, [furniture.type]);

	return (
		<mesh
			position={[position[0], height / 2, position[2]]}
			rotation={[0, rotation, 0]}
			castShadow
			receiveShadow
			userData={{ objectId: furniture.id, objectType: "furniture" }}
		>
			<boxGeometry args={[width, height, depth]} />
			<meshStandardMaterial
				color={furnitureColor}
				roughness={0.8}
				metalness={0.1}
			/>
		</mesh>
	);
}
