/**
 * Каталог мебели по умолчанию
 * Содержит типовые предметы мебели с размерами, правилами позиционирования и визуальными стилями
 */

import type { FurnitureCatalogItem, RoomType } from "@/types/plan";

/**
 * Каталог мебели по умолчанию
 */
export const defaultFurnitureCatalog: FurnitureCatalogItem[] = [
	// ========== СИДЯЧИЕ МЕСТА ==========
	{
		id: "sofa-3-seat",
		name: "Диван 3-местный",
		category: "seating",
		defaultSize: {
			width: 2100,
			depth: 900,
			height: 800,
		},
		geometryType: "rectangle",
		positioning: {
			anchorType: "against-wall",
			allowedRotations: "90",
		},
		visualStyle: {
			fillColor: "#8b7355",
			strokeColor: "#5d4e37",
			strokeWidth: 2,
			iconType: "sofa",
		},
		compatibleRoomTypes: ["living-room", "bedroom"],
		modelPath: "/furniture/Sofa.glb",
		modelSize: { width: 2.2, depth: 0.9, height: 0.85 },
	},
	{
		id: "sofa-hauga",
		name: "Диван Хауга",
		category: "seating",
		defaultSize: {
			width: 2000,
			depth: 900,
			height: 800,
		},
		geometryType: "rectangle",
		positioning: {
			anchorType: "against-wall",
			allowedRotations: "90",
		},
		visualStyle: {
			fillColor: "#8b7355",
			strokeColor: "#5d4e37",
			strokeWidth: 2,
			iconType: "sofa",
		},
		compatibleRoomTypes: ["living-room", "bedroom"],
		modelPath: "/furniture/Hauga.glb",
		modelSize: { width: 2.0, depth: 0.9, height: 0.85 },
	},
	{
		id: "chair",
		name: "Стул",
		category: "seating",
		defaultSize: {
			width: 450,
			depth: 450,
			height: 900,
		},
		geometryType: "rectangle",
		positioning: {
			anchorType: "free",
			allowedRotations: "any",
		},
		visualStyle: {
			fillColor: "#c9a961",
			strokeColor: "#8b7355",
			strokeWidth: 2,
			iconType: "chair",
		},
		compatibleRoomTypes: ["kitchen", "dining-room", "living-room"],
		modelPath: "/furniture/Chair.glb",
		modelSize: { width: 0.5, depth: 0.5, height: 0.9 },
	},
	{
		id: "wooden-chair",
		name: "Деревянный стул",
		category: "seating",
		defaultSize: {
			width: 450,
			depth: 450,
			height: 900,
		},
		geometryType: "rectangle",
		positioning: {
			anchorType: "free",
			allowedRotations: "any",
		},
		visualStyle: {
			fillColor: "#c9a961",
			strokeColor: "#8b7355",
			strokeWidth: 2,
			iconType: "chair",
		},
		compatibleRoomTypes: ["kitchen", "dining-room", "living-room"],
		modelPath: "/furniture/wooden_chair.glb",
		modelSize: { width: 0.5, depth: 0.5, height: 0.9 },
	},

	// ========== КРОВАТИ ==========
	{
		id: "bed-160x200",
		name: "Кровать 160×200",
		category: "sleeping",
		defaultSize: {
			width: 2000,
			depth: 1600,
			height: 400,
		},
		geometryType: "rectangle",
		positioning: {
			anchorType: "against-wall",
			allowedRotations: "90",
		},
		visualStyle: {
			fillColor: "#4a5568",
			strokeColor: "#2d3748",
			strokeWidth: 2,
			iconType: "bed",
		},
		compatibleRoomTypes: ["bedroom"],
		modelPath: "/furniture/bed.glb",
		modelSize: { width: 1.6, depth: 2.0, height: 0.5 },
	},
	{
		id: "bed-140x200",
		name: "Кровать 140×200",
		category: "sleeping",
		defaultSize: {
			width: 2000,
			depth: 1400,
			height: 400,
		},
		geometryType: "rectangle",
		positioning: {
			anchorType: "against-wall",
			allowedRotations: "90",
		},
		visualStyle: {
			fillColor: "#4a5568",
			strokeColor: "#2d3748",
			strokeWidth: 2,
			iconType: "bed",
		},
		compatibleRoomTypes: ["bedroom"],
		modelPath: "/furniture/Kleppstad.glb",
		modelSize: { width: 1.4, depth: 2.0, height: 0.5 },
	},

	// ========== ХРАНЕНИЕ ==========
	{
		id: "tv-cabinet",
		name: "ТВ тумба",
		category: "storage",
		defaultSize: {
			width: 1500,
			depth: 400,
			height: 500,
		},
		geometryType: "rectangle",
		positioning: {
			anchorType: "against-wall",
			allowedRotations: "90",
		},
		visualStyle: {
			fillColor: "#6b5746",
			strokeColor: "#4a3e32",
			strokeWidth: 2,
			iconType: "wardrobe",
		},
		compatibleRoomTypes: ["living-room", "bedroom"],
		modelPath: "/furniture/tv_cabinet.glb",
		modelSize: { width: 1.5, depth: 0.4, height: 0.5 },
	},
	{
		id: "shoe-rack",
		name: "Обувница",
		category: "storage",
		defaultSize: {
			width: 800,
			depth: 350,
			height: 1000,
		},
		geometryType: "rectangle",
		positioning: {
			anchorType: "against-wall",
			allowedRotations: "90",
		},
		visualStyle: {
			fillColor: "#6b5746",
			strokeColor: "#4a3e32",
			strokeWidth: 2,
			iconType: "wardrobe",
		},
		compatibleRoomTypes: ["hallway"],
		modelPath: "/furniture/shoe_rack.glb",
		modelSize: { width: 0.8, depth: 0.35, height: 1.0 },
	},

	// ========== СТОЛЫ ==========
	{
		id: "dining-table",
		name: "Обеденный стол",
		category: "tables",
		defaultSize: {
			width: 1400,
			depth: 800,
			height: 750,
		},
		geometryType: "rectangle",
		sizeConstraints: {
			minWidth: 1000,
			maxWidth: 2000,
			minDepth: 700,
			maxDepth: 1000,
		},
		positioning: {
			anchorType: "centered-in-room",
			allowedRotations: "90",
		},
		visualStyle: {
			fillColor: "#d4a574",
			strokeColor: "#b8956a",
			strokeWidth: 2,
			iconType: "table",
		},
		compatibleRoomTypes: ["kitchen", "dining-room", "living-room"],
		modelPath: "/furniture/table.glb",
		modelSize: { width: 1.0, depth: 0.6, height: 0.75 },
	},
	{
		id: "table-sandsberg",
		name: "Стол Сандсберг",
		category: "tables",
		defaultSize: {
			width: 1200,
			depth: 600,
			height: 750,
		},
		geometryType: "rectangle",
		positioning: {
			anchorType: "free",
			allowedRotations: "90",
		},
		visualStyle: {
			fillColor: "#d4a574",
			strokeColor: "#b8956a",
			strokeWidth: 2,
			iconType: "table",
		},
		compatibleRoomTypes: ["kitchen", "dining-room", "living-room"],
		modelPath: "/furniture/sandsberg_table.glb",
		modelSize: { width: 1.2, depth: 0.6, height: 0.75 },
	},
	{
		id: "table-001",
		name: "Стол 001",
		category: "tables",
		defaultSize: {
			width: 1200,
			depth: 700,
			height: 750,
		},
		geometryType: "rectangle",
		positioning: {
			anchorType: "free",
			allowedRotations: "90",
		},
		visualStyle: {
			fillColor: "#d4a574",
			strokeColor: "#b8956a",
			strokeWidth: 2,
			iconType: "table",
		},
		compatibleRoomTypes: ["kitchen", "dining-room", "living-room"],
		modelPath: "/furniture/table_001.glb",
		modelSize: { width: 1.2, depth: 0.7, height: 0.75 },
	},
	{
		id: "table-pinus",
		name: "Стол Пинус",
		category: "tables",
		defaultSize: {
			width: 1000,
			depth: 600,
			height: 750,
		},
		geometryType: "rectangle",
		positioning: {
			anchorType: "free",
			allowedRotations: "90",
		},
		visualStyle: {
			fillColor: "#d4a574",
			strokeColor: "#b8956a",
			strokeWidth: 2,
			iconType: "table",
		},
		compatibleRoomTypes: ["kitchen", "dining-room", "living-room"],
		modelPath: "/furniture/table_pinus.glb",
		modelSize: { width: 1.0, depth: 0.6, height: 0.75 },
	},
	{
		id: "coffee-table",
		name: "Журнальный стол",
		category: "tables",
		defaultSize: {
			width: 1200,
			depth: 600,
			height: 400,
		},
		geometryType: "rectangle",
		positioning: {
			anchorType: "free",
			allowedRotations: "90",
		},
		visualStyle: {
			fillColor: "#c9a961",
			strokeColor: "#a0826d",
			strokeWidth: 2,
			iconType: "coffee-table",
		},
		compatibleRoomTypes: ["living-room"],
		modelPath: "/furniture/coffee_table.glb",
		modelSize: { width: 1.2, depth: 0.6, height: 0.4 },
	},

	// ========== КУХНЯ ==========
	{
		id: "kitchen-cabinet-base",
		name: "Кухонный модуль (нижний)",
		category: "kitchen",
		defaultSize: {
			width: 600,
			depth: 600,
			height: 850,
		},
		geometryType: "rectangle",
		sizeConstraints: {
			minWidth: 300,
			maxWidth: 900,
		},
		positioning: {
			anchorType: "against-wall",
			allowedRotations: "90",
		},
		visualStyle: {
			fillColor: "#5d6d7e",
			strokeColor: "#3d4d5e",
			strokeWidth: 2,
			iconType: "kitchen-cabinet",
		},
		compatibleRoomTypes: ["kitchen"],
		modelPath: "/furniture/kitchen_cabinet.glb",
		modelSize: { width: 0.6, depth: 0.6, height: 0.9 },
	},
	{
		id: "kitchen-corner-cabinet",
		name: "Угловой кухонный шкаф",
		category: "kitchen",
		defaultSize: {
			width: 900,
			depth: 900,
			height: 850,
		},
		geometryType: "rectangle",
		positioning: {
			anchorType: "against-wall",
			allowedRotations: "90",
		},
		visualStyle: {
			fillColor: "#5d6d7e",
			strokeColor: "#3d4d5e",
			strokeWidth: 2,
			iconType: "kitchen-cabinet",
		},
		compatibleRoomTypes: ["kitchen"],
		modelPath: "/furniture/kitchen_corner_cabinet.glb",
		modelSize: { width: 0.9, depth: 0.9, height: 0.9 },
	},
	{
		id: "stove-top",
		name: "Варочная панель",
		category: "kitchen",
		defaultSize: {
			width: 600,
			depth: 600,
			height: 100,
		},
		geometryType: "rectangle",
		positioning: {
			anchorType: "against-wall",
			allowedRotations: "90",
		},
		visualStyle: {
			fillColor: "#5d6d7e",
			strokeColor: "#3d4d5e",
			strokeWidth: 2,
			iconType: "kitchen-cabinet",
		},
		compatibleRoomTypes: ["kitchen"],
		modelPath: "/furniture/stove_top.glb",
		modelSize: { width: 0.6, depth: 0.6, height: 0.1 },
	},
	{
		id: "refrigerator",
		name: "Холодильник",
		category: "kitchen",
		defaultSize: {
			width: 600,
			depth: 650,
			height: 1900,
		},
		geometryType: "rectangle",
		positioning: {
			anchorType: "against-wall",
			allowedRotations: "90",
		},
		visualStyle: {
			fillColor: "#ffffff",
			strokeColor: "#c0c0c0",
			strokeWidth: 2,
			iconType: "refrigerator",
		},
		compatibleRoomTypes: ["kitchen"],
		modelPath: "/furniture/Firdge.glb",
		modelSize: { width: 0.6, depth: 0.6, height: 1.8 },
	},
	{
		id: "double-refrigerator",
		name: "Двухкамерный холодильник",
		category: "kitchen",
		defaultSize: {
			width: 700,
			depth: 700,
			height: 1900,
		},
		geometryType: "rectangle",
		positioning: {
			anchorType: "against-wall",
			allowedRotations: "90",
		},
		visualStyle: {
			fillColor: "#ffffff",
			strokeColor: "#c0c0c0",
			strokeWidth: 2,
			iconType: "refrigerator",
		},
		compatibleRoomTypes: ["kitchen"],
		modelPath: "/furniture/double_firdge.glb",
		modelSize: { width: 0.7, depth: 0.7, height: 1.8 },
	},
	{
		id: "washer",
		name: "Стиральная машина",
		category: "technical",
		defaultSize: {
			width: 600,
			depth: 600,
			height: 850,
		},
		geometryType: "rectangle",
		positioning: {
			anchorType: "against-wall",
			allowedRotations: "90",
		},
		visualStyle: {
			fillColor: "#e5e5e5",
			strokeColor: "#c0c0c0",
			strokeWidth: 2,
			iconType: "refrigerator",
		},
		compatibleRoomTypes: ["kitchen", "bathroom"],
		modelPath: "/furniture/Washer.glb",
		modelSize: { width: 0.6, depth: 0.6, height: 0.85 },
	},
	{
		id: "tv",
		name: "Телевизор",
		category: "technical",
		defaultSize: {
			width: 1200,
			depth: 100,
			height: 700,
		},
		geometryType: "rectangle",
		positioning: {
			anchorType: "against-wall",
			allowedRotations: "90",
		},
		visualStyle: {
			fillColor: "#000000",
			strokeColor: "#333333",
			strokeWidth: 2,
			iconType: "refrigerator",
		},
		compatibleRoomTypes: ["living-room", "bedroom"],
		modelPath: "/furniture/generic_modern_tv.glb",
		modelSize: { width: 1.2, depth: 0.1, height: 0.7 },
	},

	// ========== САНТЕХНИКА ==========
	{
		id: "toilet",
		name: "Унитаз",
		category: "bathroom",
		defaultSize: {
			width: 400,
			depth: 700,
			height: 400,
		},
		geometryType: "complex",
		positioning: {
			anchorType: "against-wall",
			allowedRotations: "any",
			minDistanceFromWall: 150,
		},
		visualStyle: {
			fillColor: "#ffffff",
			strokeColor: "#c0c0c0",
			strokeWidth: 2,
			iconType: "toilet",
		},
		compatibleRoomTypes: ["bathroom", "toilet"],
		modelPath: "/furniture/toilet_seat.glb",
		modelSize: { width: 0.4, depth: 0.5, height: 0.4 },
	},
	{
		id: "sink",
		name: "Раковина",
		category: "bathroom",
		defaultSize: {
			width: 600,
			depth: 500,
			height: 850,
		},
		geometryType: "complex",
		positioning: {
			anchorType: "against-wall",
			allowedRotations: "90",
		},
		visualStyle: {
			fillColor: "#ffffff",
			strokeColor: "#c0c0c0",
			strokeWidth: 2,
			iconType: "sink",
		},
		compatibleRoomTypes: ["bathroom", "toilet", "kitchen"],
		modelPath: "/furniture/bathroom_sink.glb",
		modelSize: { width: 0.6, depth: 0.5, height: 0.85 },
	},
	{
		id: "bathtub",
		name: "Ванна",
		category: "bathroom",
		defaultSize: {
			width: 1700,
			depth: 700,
			height: 600,
		},
		geometryType: "complex",
		positioning: {
			anchorType: "against-wall",
			allowedRotations: "90",
		},
		visualStyle: {
			fillColor: "#e0f2fe",
			strokeColor: "#0284c7",
			strokeWidth: 2,
			iconType: "bathtub",
		},
		compatibleRoomTypes: ["bathroom"],
		modelPath: "/furniture/standard_bathtub.glb",
		modelSize: { width: 1.7, depth: 0.7, height: 0.6 },
	},
];

/**
 * Получить элементы каталога по категории
 */
export function getFurnitureByCategory(
	category: FurnitureCatalogItem["category"],
	catalog: FurnitureCatalogItem[] = defaultFurnitureCatalog
): FurnitureCatalogItem[] {
	return catalog.filter((item) => item.category === category);
}

/**
 * Получить элементы каталога, совместимые с типом комнаты
 */
export function getFurnitureByRoomType(
	roomType: RoomType,
	catalog: FurnitureCatalogItem[] = defaultFurnitureCatalog
): FurnitureCatalogItem[] {
	return catalog.filter(
		(item) =>
			!item.compatibleRoomTypes ||
			item.compatibleRoomTypes.length === 0 ||
			item.compatibleRoomTypes.includes(roomType)
	);
}

/**
 * Найти элемент каталога по ID
 */
export function findCatalogItem(
	id: string,
	catalog: FurnitureCatalogItem[] = defaultFurnitureCatalog
): FurnitureCatalogItem | undefined {
	return catalog.find((item) => item.id === id);
}
