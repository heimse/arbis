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
export type MeasurementUnit = 'mm' | 'cm' | 'm';

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
  type: 'exterior' | 'interior' | 'partition'; // внешняя / внутренняя / перегородка
  height?: number; // высота в мм (опционально)
  materialId?: string;
  layerId: string;
};

/**
 * Тип двери
 */
export type DoorType = 'single' | 'double' | 'sliding' | 'folding';

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
  openingDirection: 'left' | 'right' | 'in' | 'out';
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
  | 'linear' // Линейный размер (точка-точка)
  | 'wall' // Размер стены (автоматический)
  | 'horizontal' // Горизонтальный размер
  | 'vertical'; // Вертикальный размер

/**
 * Целевой объект для привязки размера
 */
export type DimensionTarget = 
  | { type: 'point'; point: Point }
  | { type: 'node'; nodeId: string }
  | { type: 'wall'; wallId: string; startNode: boolean } // true = начало стены, false = конец
  | { type: 'wall-center'; wallId: string };

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
export type SnapType = 'grid' | 'node' | 'midpoint' | 'perpendicular' | 'extension';

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
 * Комната на плане
 */
export type Room = {
  id: string;
  name: string;
  position: Point; // левый верхний угол
  size: { width: number; height: number }; // в условных единицах (пиксели)
  rotation: number; // угол поворота в градусах (пока 0)
};

/**
 * Предмет мебели на плане
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
  
  // Помещения и мебель (легаси, но оставляем для совместимости)
  rooms: Room[];
  furniture: FurnitureItem[];
  
  // Размеры и аннотации
  dimensions: DimensionLine[];
  
  // Слои
  layers: Layer[];
  
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
    id: 'layer-walls',
    name: 'Стены',
    visible: true,
    locked: false,
    opacity: 1,
    color: '#000000',
    order: 1,
  },
  {
    id: 'layer-openings',
    name: 'Проёмы',
    visible: true,
    locked: false,
    opacity: 1,
    color: '#1976d2',
    order: 2,
  },
  {
    id: 'layer-furniture',
    name: 'Мебель',
    visible: true,
    locked: false,
    opacity: 1,
    color: '#f57c00',
    order: 3,
  },
  {
    id: 'layer-dimensions',
    name: 'Размеры',
    visible: true,
    locked: false,
    opacity: 1,
    color: '#4caf50',
    order: 4,
  },
  {
    id: 'layer-annotations',
    name: 'Аннотации',
    visible: true,
    locked: false,
    opacity: 1,
    color: '#9c27b0',
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
  dimensions: [],
  layers: [...defaultLayers],
  realWorldSize: {
    widthMeters: 12.5,
    heightMeters: 12,
    pixelsPerMeter: 80,
  },
  backgroundImage: undefined,
  measurementUnit: 'mm',
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

