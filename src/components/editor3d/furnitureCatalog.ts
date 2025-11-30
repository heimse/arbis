/**
 * Каталог мебели с GLB моделями
 */

export interface FurnitureCatalogItem {
	id: string;
	name: string;
	category: string;
	modelPath: string;
	defaultSize: {
		width: number; // метры
		depth: number; // метры
		height: number; // метры
	};
	icon?: string; // путь к иконке (опционально)
}

/**
 * Категории мебели
 */
export const FURNITURE_CATEGORIES = [
	"Диваны",
	"Кровати",
	"Столы",
	"Стулья",
	"Шкафы",
	"Кухонная мебель",
	"Сантехника",
	"Техника",
	"Другое",
] as const;

/**
 * Каталог мебели
 */
export const FURNITURE_CATALOG: FurnitureCatalogItem[] = [
	// Диваны
	{
		id: "sofa-1",
		name: "Диван",
		category: "Диваны",
		modelPath: "/furniture/Sofa.glb",
		defaultSize: { width: 2.2, depth: 0.9, height: 0.85 },
	},
	{
		id: "hauga-1",
		name: "Хауга",
		category: "Диваны",
		modelPath: "/furniture/Hauga.glb",
		defaultSize: { width: 2.0, depth: 0.9, height: 0.85 },
	},

	// Кровати
	{
		id: "bed-1",
		name: "Кровать",
		category: "Кровати",
		modelPath: "/furniture/bed.glb",
		defaultSize: { width: 1.6, depth: 2.0, height: 0.5 },
	},
	{
		id: "kleppstad-1",
		name: "Клеппстад",
		category: "Кровати",
		modelPath: "/furniture/Kleppstad.glb",
		defaultSize: { width: 1.4, depth: 2.0, height: 0.5 },
	},

	// Столы
	{
		id: "coffee-table-1",
		name: "Журнальный стол",
		category: "Столы",
		modelPath: "/furniture/coffee_table.glb",
		defaultSize: { width: 1.2, depth: 0.6, height: 0.4 },
	},
	{
		id: "sandsberg-table-1",
		name: "Стол Сандсберг",
		category: "Столы",
		modelPath: "/furniture/sandsberg_table.glb",
		defaultSize: { width: 1.2, depth: 0.6, height: 0.75 },
	},
	{
		id: "table-1",
		name: "Стол",
		category: "Столы",
		modelPath: "/furniture/table.glb",
		defaultSize: { width: 1.0, depth: 0.6, height: 0.75 },
	},
	{
		id: "table-001-1",
		name: "Стол 001",
		category: "Столы",
		modelPath: "/furniture/table_001.glb",
		defaultSize: { width: 1.2, depth: 0.7, height: 0.75 },
	},
	{
		id: "table-pinus-1",
		name: "Стол Пинус",
		category: "Столы",
		modelPath: "/furniture/table_pinus.glb",
		defaultSize: { width: 1.0, depth: 0.6, height: 0.75 },
	},

	// Стулья
	{
		id: "chair-1",
		name: "Стул",
		category: "Стулья",
		modelPath: "/furniture/Chair.glb",
		defaultSize: { width: 0.5, depth: 0.5, height: 0.9 },
	},
	{
		id: "wooden-chair-1",
		name: "Деревянный стул",
		category: "Стулья",
		modelPath: "/furniture/wooden_chair.glb",
		defaultSize: { width: 0.5, depth: 0.5, height: 0.9 },
	},

	// Шкафы
	{
		id: "tv-cabinet-1",
		name: "ТВ тумба",
		category: "Шкафы",
		modelPath: "/furniture/tv_cabinet.glb",
		defaultSize: { width: 1.5, depth: 0.4, height: 0.5 },
	},
	{
		id: "shoe-rack-1",
		name: "Обувница",
		category: "Шкафы",
		modelPath: "/furniture/shoe_rack.glb",
		defaultSize: { width: 0.8, depth: 0.35, height: 1.0 },
	},

	// Кухонная мебель
	{
		id: "kitchen-cabinet-1",
		name: "Кухонный шкаф",
		category: "Кухонная мебель",
		modelPath: "/furniture/kitchen_cabinet.glb",
		defaultSize: { width: 0.6, depth: 0.6, height: 0.9 },
	},
	{
		id: "kitchen-corner-cabinet-1",
		name: "Угловой кухонный шкаф",
		category: "Кухонная мебель",
		modelPath: "/furniture/kitchen_corner_cabinet.glb",
		defaultSize: { width: 0.9, depth: 0.9, height: 0.9 },
	},
	{
		id: "stove-top-1",
		name: "Варочная панель",
		category: "Кухонная мебель",
		modelPath: "/furniture/stove_top.glb",
		defaultSize: { width: 0.6, depth: 0.6, height: 0.1 },
	},

	// Техника
	{
		id: "fridge-1",
		name: "Холодильник",
		category: "Техника",
		modelPath: "/furniture/Firdge.glb",
		defaultSize: { width: 0.6, depth: 0.6, height: 1.8 },
	},
	{
		id: "double-fridge-1",
		name: "Двухкамерный холодильник",
		category: "Техника",
		modelPath: "/furniture/double_firdge.glb",
		defaultSize: { width: 0.7, depth: 0.7, height: 1.8 },
	},
	{
		id: "washer-1",
		name: "Стиральная машина",
		category: "Техника",
		modelPath: "/furniture/Washer.glb",
		defaultSize: { width: 0.6, depth: 0.6, height: 0.85 },
	},
	{
		id: "tv-1",
		name: "Телевизор",
		category: "Техника",
		modelPath: "/furniture/generic_modern_tv.glb",
		defaultSize: { width: 1.2, depth: 0.1, height: 0.7 },
	},

	// Сантехника
	{
		id: "bathroom-sink-1",
		name: "Раковина",
		category: "Сантехника",
		modelPath: "/furniture/bathroom_sink.glb",
		defaultSize: { width: 0.6, depth: 0.5, height: 0.85 },
	},
	{
		id: "bathtub-1",
		name: "Ванна",
		category: "Сантехника",
		modelPath: "/furniture/standard_bathtub.glb",
		defaultSize: { width: 1.7, depth: 0.7, height: 0.6 },
	},
	{
		id: "toilet-1",
		name: "Унитаз",
		category: "Сантехника",
		modelPath: "/furniture/toilet_seat.glb",
		defaultSize: { width: 0.4, depth: 0.5, height: 0.4 },
	},
];

/**
 * Получить мебель по категории
 */
export function getFurnitureByCategory(
	category: string
): FurnitureCatalogItem[] {
	return FURNITURE_CATALOG.filter((item) => item.category === category);
}

/**
 * Получить мебель по ID
 */
export function getFurnitureById(id: string): FurnitureCatalogItem | undefined {
	return FURNITURE_CATALOG.find((item) => item.id === id);
}
