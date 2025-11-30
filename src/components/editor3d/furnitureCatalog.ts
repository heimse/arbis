/**
 * Каталог 3D-моделей мебели
 * Описывает метаданные для моделей, лежащих в /public/furniture/
 * ВСЕ модели в этом каталоге должны соответствовать реальным .glb файлам в /public/furniture/
 */

export interface FurnitureCatalogItem {
	id: string; // ключ, который будет использоваться в Furniture.type или отдельном поле
	name: string; // читаемое название ("Диван 3-местный", "Кровать 160", "Стол обеденный" и т.п.)
	category: string; // "sofa" | "bed" | "table" | "chair" | "wardrobe" | "appliance" | "bathroom" | "tv"
	modelPath: string; // путь вида "/furniture/sofa.glb" (относительно /public/)
	defaultFootprint: {
		width: number; // метры (по оси X в плане)
		depth: number; // метры (по оси Z/по Y плана)
	};
	defaultHeight?: number; // метры (если известна высота)
}

/**
 * Статический каталог мебели
 * modelPath ВСЕГДА указывает на .glb в /public/furniture/....
 * Все модели в этом массиве должны существовать в /public/furniture/
 */
export const FURNITURE_CATALOG: FurnitureCatalogItem[] = [
	// Диваны
	{
		id: "sofa",
		name: "Диван",
		category: "sofa",
		modelPath: "/furniture/Sofa.glb",
		defaultFootprint: {
			width: 2.0, // метры
			depth: 0.9, // метры
		},
		defaultHeight: 0.85,
	},
	// Кровати
	{
		id: "bed",
		name: "Кровать",
		category: "bed",
		modelPath: "/furniture/bed.glb",
		defaultFootprint: {
			width: 1.6, // метры
			depth: 2.0, // метры
		},
		defaultHeight: 0.5,
	},
	// Столы
	{
		id: "table",
		name: "Стол",
		category: "table",
		modelPath: "/furniture/table.glb",
		defaultFootprint: {
			width: 1.2, // метры
			depth: 0.8, // метры
		},
		defaultHeight: 0.75,
	},
	{
		id: "table_001",
		name: "Стол обеденный",
		category: "table",
		modelPath: "/furniture/table_001.glb",
		defaultFootprint: {
			width: 1.5, // метры
			depth: 0.9, // метры
		},
		defaultHeight: 0.75,
	},
	{
		id: "table_pinus",
		name: "Стол сосновый",
		category: "table",
		modelPath: "/furniture/table_pinus.glb",
		defaultFootprint: {
			width: 1.2, // метры
			depth: 0.7, // метры
		},
		defaultHeight: 0.75,
	},
	{
		id: "coffee_table",
		name: "Журнальный столик",
		category: "table",
		modelPath: "/furniture/coffee_table.glb",
		defaultFootprint: {
			width: 1.0, // метры
			depth: 0.6, // метры
		},
		defaultHeight: 0.4,
	},
	{
		id: "sandsberg_table",
		name: "Стол Sandsberg",
		category: "table",
		modelPath: "/furniture/sandsberg_table.glb",
		defaultFootprint: {
			width: 1.4, // метры
			depth: 0.8, // метры
		},
		defaultHeight: 0.75,
	},
	// Стулья
	{
		id: "chair",
		name: "Стул",
		category: "chair",
		modelPath: "/furniture/Chair.glb",
		defaultFootprint: {
			width: 0.5, // метры
			depth: 0.5, // метры
		},
		defaultHeight: 0.9,
	},
	{
		id: "wooden_chair",
		name: "Деревянный стул",
		category: "chair",
		modelPath: "/furniture/wooden_chair.glb",
		defaultFootprint: {
			width: 0.5, // метры
			depth: 0.5, // метры
		},
		defaultHeight: 0.9,
	},
	// Шкафы и тумбы
	{
		id: "tv_cabinet",
		name: "ТВ-тумба",
		category: "wardrobe",
		modelPath: "/furniture/tv_cabinet.glb",
		defaultFootprint: {
			width: 1.5, // метры
			depth: 0.4, // метры
		},
		defaultHeight: 0.5,
	},
	{
		id: "hauga",
		name: "Шкаф Hauga",
		category: "wardrobe",
		modelPath: "/furniture/Hauga.glb",
		defaultFootprint: {
			width: 1.2, // метры
			depth: 0.4, // метры
		},
		defaultHeight: 1.8,
	},
	{
		id: "kleppstad",
		name: "Шкаф Kleppstad",
		category: "wardrobe",
		modelPath: "/furniture/Kleppstad.glb",
		defaultFootprint: {
			width: 1.0, // метры
			depth: 0.4, // метры
		},
		defaultHeight: 1.8,
	},
	{
		id: "shoe_rack",
		name: "Обувница",
		category: "wardrobe",
		modelPath: "/furniture/shoe_rack.glb",
		defaultFootprint: {
			width: 0.8, // метры
			depth: 0.3, // метры
		},
		defaultHeight: 0.9,
	},
	{
		id: "kitchen_cabinet",
		name: "Кухонный шкаф",
		category: "wardrobe",
		modelPath: "/furniture/kitchen_cabinet.glb",
		defaultFootprint: {
			width: 0.6, // метры
			depth: 0.6, // метры
		},
		defaultHeight: 0.9,
	},
	{
		id: "kitchen_corner_cabinet",
		name: "Угловой кухонный шкаф",
		category: "wardrobe",
		modelPath: "/furniture/kitchen_corner_cabinet.glb",
		defaultFootprint: {
			width: 0.9, // метры
			depth: 0.9, // метры
		},
		defaultHeight: 0.9,
	},
	// Техника
	{
		id: "generic_modern_tv",
		name: "Телевизор",
		category: "tv",
		modelPath: "/furniture/generic_modern_tv.glb",
		defaultFootprint: {
			width: 1.2, // метры
			depth: 0.1, // метры
		},
		defaultHeight: 0.7,
	},
	{
		id: "fridge",
		name: "Холодильник",
		category: "appliance",
		modelPath: "/furniture/Firdge.glb",
		defaultFootprint: {
			width: 0.6, // метры
			depth: 0.6, // метры
		},
		defaultHeight: 1.8,
	},
	{
		id: "double_fridge",
		name: "Двухкамерный холодильник",
		category: "appliance",
		modelPath: "/furniture/double_firdge.glb",
		defaultFootprint: {
			width: 0.9, // метры
			depth: 0.7, // метры
		},
		defaultHeight: 1.8,
	},
	{
		id: "washer",
		name: "Стиральная машина",
		category: "appliance",
		modelPath: "/furniture/Washer.glb",
		defaultFootprint: {
			width: 0.6, // метры
			depth: 0.6, // метры
		},
		defaultHeight: 0.85,
	},
	{
		id: "stove_top",
		name: "Варочная панель",
		category: "appliance",
		modelPath: "/furniture/stove_top.glb",
		defaultFootprint: {
			width: 0.6, // метры
			depth: 0.6, // метры
		},
		defaultHeight: 0.1,
	},
	// Сантехника
	{
		id: "bathroom_sink",
		name: "Раковина",
		category: "bathroom",
		modelPath: "/furniture/bathroom_sink.glb",
		defaultFootprint: {
			width: 0.6, // метры
			depth: 0.5, // метры
		},
		defaultHeight: 0.85,
	},
	{
		id: "standard_bathtub",
		name: "Ванна",
		category: "bathroom",
		modelPath: "/furniture/standard_bathtub.glb",
		defaultFootprint: {
			width: 1.7, // метры
			depth: 0.7, // метры
		},
		defaultHeight: 0.6,
	},
	{
		id: "toilet_seat",
		name: "Унитаз",
		category: "bathroom",
		modelPath: "/furniture/toilet_seat.glb",
		defaultFootprint: {
			width: 0.4, // метры
			depth: 0.5, // метры
		},
		defaultHeight: 0.4,
	},
];

/**
 * Находит элемент каталога по типу мебели
 * @param type - тип мебели из Furniture.type
 * @returns элемент каталога или undefined
 */
export function getFurnitureItemByType(
	type: string
): FurnitureCatalogItem | undefined {
	return FURNITURE_CATALOG.find(
		(item) => item.id === type || item.category === type
	);
}

/**
 * Находит элемент каталога по ID
 * @param id - ID элемента каталога
 * @returns элемент каталога или undefined
 */
export function getFurnitureItemById(
	id: string
): FurnitureCatalogItem | undefined {
	return FURNITURE_CATALOG.find((item) => item.id === id);
}
