/**
 * Типы для профессионального 2D-редактора планировки
 * Используются в редакторе и для хранения в PlanVersion.data
 */

// npm install zustand immer nanoid

/**
 * Точка в 2D пространстве (в условных единицах, можно считать пикселями)
 */
export type Point = {
	x: number;
	y: number;
};

/**
 * Единицы измерения
 */
export type MeasurementUnit = "mm" | "cm" | "m";

/**
 * Узел стены (вершина, соединение стен)
 */
export type WallNode = {
	id: string;
	position: Point;
	connectedWallIds: string[]; // ID стен, соединенных с этим узлом
};

/**
 * Стена
 */
export type Wall = {
	id: string;
	startNodeId: string;
	endNodeId: string;
	thickness: number; // в мм
	type: "exterior" | "interior" | "partition"; // внешняя / внутренняя / перегородка
	height?: number; // высота в мм (опционально)
	materialId?: string;
	layerId: string;
};

/**
 * Тип двери
 */
export type DoorType = "single" | "double" | "sliding" | "folding";

/**
 * Дверь
 */
export type Door = {
	id: string;
	wallId: string; // ID стены, в которой находится дверь
	position: number; // позиция вдоль стены (0..1)
	width: number; // ширина проёма в мм
	height: number; // высота в мм
	type: DoorType;
	openingAngle: number; // угол открывания в градусах
	openingDirection: "left" | "right" | "in" | "out";
	layerId: string;
};

/**
 * Окно
 */
export type Window = {
	id: string;
	wallId: string;
	position: number; // позиция вдоль стены (0..1)
	width: number; // ширина в мм
	height: number; // высота в мм
	sillHeight: number; // высота подоконника от пола в мм
	layerId: string;
};

/**
 * Тип размерной линии
 */
export type DimensionType =
	| "linear" // Линейный размер (точка-точка)
	| "wall" // Размер стены (автоматический)
	| "horizontal" // Горизонтальный размер
	| "vertical"; // Вертикальный размер

/**
 * Целевой объект для привязки размера
 */
export type DimensionTarget =
	| { type: "point"; point: Point }
	| { type: "node"; nodeId: string }
	| { type: "wall"; wallId: string; startNode: boolean } // true = начало стены, false = конец
	| { type: "wall-center"; wallId: string };

/**
 * Размерная линия
 */
export type DimensionLine = {
	id: string;
	dimensionType: DimensionType;
	startTarget: DimensionTarget; // Целевая точка начала
	endTarget: DimensionTarget; // Целевая точка конца
	startPoint: Point; // Фактическая точка начала (вычисляется из target)
	endPoint: Point; // Фактическая точка конца (вычисляется из target)
	offset: number; // смещение размерной линии от объектов (в пикселях)
	text?: string; // пользовательский текст (если не задан, показывается длина)
	layerId: string;
	// Автоматическое вычисление смещения для лучшего отображения
	autoOffset?: boolean;
};

/**
 * Слой
 */
export type Layer = {
	id: string;
	name: string;
	visible: boolean;
	locked: boolean;
	opacity: number; // 0..1
	color: string; // цвет для отображения объектов слоя
	order: number; // порядок отрисовки
};

/**
 * Тип snap
 */
export type SnapType =
	| "grid"
	| "node"
	| "midpoint"
	| "perpendicular"
	| "extension";

/**
 * Настройки snap
 */
export type SnapSettings = {
	enabled: boolean;
	snapToGrid: boolean;
	snapToNodes: boolean;
	snapToMidpoints: boolean;
	snapToPerpendicular: boolean;
	snapToExtension: boolean;
	snapDistance: number; // в пикселях
};

/**
 * Тип использования комнаты
 */
export type RoomType =
	| "bedroom" // спальня
	| "living-room" // гостиная
	| "kitchen" // кухня
	| "dining-room" // столовая
	| "bathroom" // санузел
	| "toilet" // туалет
	| "corridor" // коридор
	| "hallway" // прихожая
	| "balcony" // балкон
	| "loggia" // лоджия
	| "storage" // кладовая
	| "technical" // тех. помещение
	| "other"; // другое

/**
 * Материал пола
 */
export type FloorMaterial = {
	id: string;
	name: string; // например, "паркет дуб", "плитка 600×600"
	color: string; // базовый цвет для отрисовки (hex)
	textureUrl?: string; // ссылка на текстуру/паттерн (на будущее)
	roughness?: number; // шероховатость для 3D (0-1)
	metalness?: number; // металличность для 3D (0-1)
};

/**
 * Вариант отделки мебели (swatch)
 */
export type FurnitureSwatch = {
	id: string;
	name: string; // "Белый", "Дуб", "Серый текстиль"
	color: string; // базовый цвет (hex)
	textureUrl?: string; // ссылка на текстуру
	material?: {
		roughness?: number;
		metalness?: number;
	};
};

/**
 * Этаж/уровень здания
 */
export type Floor = {
	id: string;
	name: string; // "1 этаж", "2 этаж"
	level: number; // порядковый номер этажа (0, 1, 2...)
	height: number; // высота этажа в мм
	offsetY: number; // смещение по Y в метрах (для позиционирования в 3D)
	visible: boolean; // видимость этажа
};

/**
 * Комната на плане (новая версия - привязана к стенам)
 */
export type Room = {
	id: string;
	name: string;

	// Геометрия
	polygon: Point[]; // замкнутый многоугольник (контур в мировых координатах)
	wallIds: string[]; // ID стен, которые формируют периметр комнаты

	// Расчётные параметры
	area: number; // площадь в м²
	perimeter: number; // периметр в м

	// Тип использования
	roomType: RoomType;

	// Связь с отделкой пола
	floorMaterial?: FloorMaterial;
	floorLevel: number; // уровень пола (чистый пол) по высоте, в мм

	// Слой
	layerId: string;

	// Системные поля
	geometrySynced: boolean; // флаг, что геометрия синхронизирована со стенами
};

/**
 * Категории мебели
 */
export type FurnitureCategory =
	| "seating" // сидячие места (диваны, кресла, стулья)
	| "sleeping" // кровати
	| "storage" // шкафы, комоды, стеллажи
	| "tables" // столы
	| "kitchen" // кухонные модули
	| "bathroom" // санитарное оборудование
	| "technical" // оборудование
	| "custom"; // пользовательские шаблоны

/**
 * Тип геометрического представления мебели
 */
export type FurnitureGeometryType =
	| "rectangle" // прямоугольник
	| "l-shaped" // L-образный (угловой диван)
	| "complex"; // сложная форма (упрощённая до контура)

/**
 * Тип привязки мебели
 */
export type FurnitureAnchorType =
	| "free" // свободно по полу
	| "against-wall" // у стены
	| "centered-in-room"; // в центре комнаты

/**
 * Правила позиционирования мебели
 */
export type FurniturePositioning = {
	anchorType: FurnitureAnchorType;
	allowedRotations: "any" | "90" | "45"; // любые углы или кратные 90°/45°
	minDistanceFromWall?: number; // минимальный отступ от стены (мм)
	minDistanceFromOther?: number; // минимальный отступ от других элементов (мм)
};

/**
 * Ограничения размеров мебели
 */
export type FurnitureSizeConstraints = {
	minWidth?: number; // минимальная ширина (мм)
	maxWidth?: number; // максимальная ширина (мм)
	minDepth?: number; // минимальная глубина (мм)
	maxDepth?: number; // максимальная глубина (мм)
};

/**
 * Визуальные свойства мебели для 2D отображения
 */
export type FurnitureVisualStyle = {
	fillColor: string; // цвет заливки
	strokeColor: string; // цвет контура
	strokeWidth: number; // толщина контура
	iconType?: string; // тип иконки для условного обозначения
};

/**
 * Элемент каталога мебели
 */
export type FurnitureCatalogItem = {
	id: string;
	name: string; // "Диван 3-местный", "Кровать 160×200"
	category: FurnitureCategory;

	// Геометрия по умолчанию
	defaultSize: {
		width: number; // ширина (мм)
		depth: number; // глубина (мм)
		height?: number; // высота (мм, опционально)
	};

	geometryType: FurnitureGeometryType;
	sizeConstraints?: FurnitureSizeConstraints;

	// Правила позиционирования
	positioning: FurniturePositioning;

	// Визуальные свойства
	visualStyle: FurnitureVisualStyle;

	// Варианты отделки
	swatches?: FurnitureSwatch[]; // список доступных вариантов цвета/материала

	// Теги и совместимость
	compatibleRoomTypes?: RoomType[]; // подходящие типы комнат

	// Спецификация для отчётов
	articleCode?: string; // артикул
	manufacturer?: string; // производитель
	collection?: string; // коллекция/серия
	price?: number; // примерная цена

	// 3D модель (опционально)
	modelPath?: string; // путь к GLB модели для 3D визуализации
	modelSize?: { width: number; depth: number; height: number }; // размеры модели в метрах (для масштабирования)
};

/**
 * Экземпляр мебели на плане
 */
export type FurnitureInstance = {
	id: string;
	catalogItemId: string; // ссылка на элемент каталога

	// Геометрия и позиционирование
	position: Point; // точка привязки (anchor point)
	size: {
		width: number; // ширина/длина (мм)
		depth: number; // глубина (мм)
		height?: number; // высота (мм)
	};
	rotation: number; // угол поворота в градусах (0-360)
	configuration?: string; // вариант конфигурации (левый/правый угол и т.д.)

	// Принадлежность
	roomId?: string; // ID комнаты, если предмет внутри комнаты
	layerId: string; // ID слоя
	floorId?: string; // ID этажа (на будущее)

	// Вариант отделки
	swatchId?: string; // ID выбранного варианта цвета/материала

	// Семантика и кастомизация
	customName?: string; // пользовательское имя/подпись
	articleCode?: string; // может переопределять каталог
	manufacturer?: string;

	// Системные поля
	locked: boolean; // флаг "заблокирован"
	hidden: boolean; // флаг "невидим"
	isGhost?: boolean; // флаг "призрак" (для предпросмотра размещения)

	// Статус конфликтов (для будущих проверок)
	conflicts?: {
		intersectsWall?: boolean;
		blocksDoor?: boolean;
		blocksPassage?: boolean;
	};
};

/**
 * Предмет мебели на плане (легаси, оставляем для совместимости)
 * @deprecated Используйте FurnitureInstance
 */
export type FurnitureItem = {
	id: string;
	type: string; // "sofa" | "bed" | "table" | ... – пока просто строка
	position: Point;
	size: { width: number; height: number };
	rotation: number; // угол поворота в градусах
};

/**
 * Реальные размеры плана в метрах
 */
export type PlanRealWorldSize = {
	widthMeters: number;
	heightMeters: number;
	pixelsPerMeter: number; // масштаб для svg
};

/**
 * Фоновое изображение плана
 */
export type PlanBackgroundImage = {
	url: string;
	opacity: number; // 0..1
	scale: number; // доп. масштаб поверх реального
	offset: Point; // сдвиг относительно (0,0) плана в тех же единицах (px)
	visible: boolean;
};

/**
 * Полная структура планировки (профессиональная)
 */
export type PlanData = {
	// Архитектурные элементы
	nodes: WallNode[]; // узлы стен
	walls: Wall[];
	doors: Door[];
	windows: Window[];

	// Помещения и мебель
	rooms: Room[];
	furniture: FurnitureItem[]; // легаси, для совместимости
	furnitureInstances: FurnitureInstance[]; // новая система мебели
	furnitureCatalog?: FurnitureCatalogItem[]; // каталог мебели (опционально, может быть глобальным)

	// Размеры и аннотации
	dimensions: DimensionLine[];

	// Слои
	layers: Layer[];

	// Этажи (на будущее)
	floors?: Floor[]; // список этажей

	// Настройки плана
	realWorldSize?: PlanRealWorldSize;
	backgroundImage?: PlanBackgroundImage;
	measurementUnit: MeasurementUnit;
	snapSettings: SnapSettings;
};

/**
 * Слои по умолчанию
 */
export const defaultLayers: Layer[] = [
	{
		id: "layer-walls",
		name: "Стены",
		visible: true,
		locked: false,
		opacity: 1,
		color: "#000000",
		order: 1,
	},
	{
		id: "layer-openings",
		name: "Проёмы",
		visible: true,
		locked: false,
		opacity: 1,
		color: "#1976d2",
		order: 2,
	},
	{
		id: "layer-rooms",
		name: "Комнаты",
		visible: true,
		locked: false,
		opacity: 0.4,
		color: "#3b82f6",
		order: 2.5,
	},
	{
		id: "layer-furniture",
		name: "Мебель",
		visible: true,
		locked: false,
		opacity: 1,
		color: "#f57c00",
		order: 3,
	},
	{
		id: "layer-dimensions",
		name: "Размеры",
		visible: true,
		locked: false,
		opacity: 1,
		color: "#4caf50",
		order: 4,
	},
	{
		id: "layer-annotations",
		name: "Аннотации",
		visible: true,
		locked: false,
		opacity: 1,
		color: "#9c27b0",
		order: 5,
	},
];

/**
 * Пустая планировка для инициализации
 */
export const emptyPlan: PlanData = {
	nodes: [],
	walls: [],
	doors: [],
	windows: [],
	rooms: [],
	furniture: [],
	furnitureInstances: [],
	furnitureCatalog: undefined, // будет загружен отдельно
	dimensions: [],
	layers: [...defaultLayers],
	realWorldSize: {
		widthMeters: 12.5,
		heightMeters: 12,
		pixelsPerMeter: 80,
	},
	backgroundImage: undefined,
	measurementUnit: "mm",
	snapSettings: {
		enabled: true,
		snapToGrid: true,
		snapToNodes: true,
		snapToMidpoints: true,
		snapToPerpendicular: true,
		snapToExtension: false,
		snapDistance: 10,
	},
};
