/**
 * Каталог мебели по умолчанию
 * Содержит типовые предметы мебели с размерами, правилами позиционирования и визуальными стилями
 */

import type { FurnitureCatalogItem, RoomType } from '@/types/plan';

/**
 * Каталог мебели по умолчанию
 */
export const defaultFurnitureCatalog: FurnitureCatalogItem[] = [
  // ========== СИДЯЧИЕ МЕСТА ==========
  {
    id: 'sofa-3-seat',
    name: 'Диван 3-местный',
    category: 'seating',
    defaultSize: {
      width: 2100,
      depth: 900,
      height: 800,
    },
    geometryType: 'rectangle',
    positioning: {
      anchorType: 'against-wall',
      allowedRotations: '90',
    },
    visualStyle: {
      fillColor: '#8b7355',
      strokeColor: '#5d4e37',
      strokeWidth: 2,
      iconType: 'sofa',
    },
    compatibleRoomTypes: ['living-room', 'bedroom'],
  },
  {
    id: 'sofa-corner',
    name: 'Диван угловой',
    category: 'seating',
    defaultSize: {
      width: 2800,
      depth: 1600,
      height: 800,
    },
    geometryType: 'l-shaped',
    positioning: {
      anchorType: 'against-wall',
      allowedRotations: '90',
    },
    visualStyle: {
      fillColor: '#8b7355',
      strokeColor: '#5d4e37',
      strokeWidth: 2,
      iconType: 'sofa-corner',
    },
    compatibleRoomTypes: ['living-room'],
  },
  {
    id: 'armchair',
    name: 'Кресло',
    category: 'seating',
    defaultSize: {
      width: 800,
      depth: 900,
      height: 900,
    },
    geometryType: 'rectangle',
    positioning: {
      anchorType: 'free',
      allowedRotations: 'any',
    },
    visualStyle: {
      fillColor: '#a0826d',
      strokeColor: '#6b5746',
      strokeWidth: 2,
      iconType: 'armchair',
    },
    compatibleRoomTypes: ['living-room', 'bedroom'],
  },
  {
    id: 'chair',
    name: 'Стул',
    category: 'seating',
    defaultSize: {
      width: 450,
      depth: 450,
      height: 900,
    },
    geometryType: 'rectangle',
    positioning: {
      anchorType: 'free',
      allowedRotations: 'any',
    },
    visualStyle: {
      fillColor: '#c9a961',
      strokeColor: '#8b7355',
      strokeWidth: 2,
      iconType: 'chair',
    },
    compatibleRoomTypes: ['kitchen', 'dining-room', 'living-room'],
  },

  // ========== КРОВАТИ ==========
  {
    id: 'bed-160x200',
    name: 'Кровать 160×200',
    category: 'sleeping',
    defaultSize: {
      width: 2000,
      depth: 1600,
      height: 400,
    },
    geometryType: 'rectangle',
    positioning: {
      anchorType: 'against-wall',
      allowedRotations: '90',
    },
    visualStyle: {
      fillColor: '#4a5568',
      strokeColor: '#2d3748',
      strokeWidth: 2,
      iconType: 'bed',
    },
    compatibleRoomTypes: ['bedroom'],
  },
  {
    id: 'bed-140x200',
    name: 'Кровать 140×200',
    category: 'sleeping',
    defaultSize: {
      width: 2000,
      depth: 1400,
      height: 400,
    },
    geometryType: 'rectangle',
    positioning: {
      anchorType: 'against-wall',
      allowedRotations: '90',
    },
    visualStyle: {
      fillColor: '#4a5568',
      strokeColor: '#2d3748',
      strokeWidth: 2,
      iconType: 'bed',
    },
    compatibleRoomTypes: ['bedroom'],
  },

  // ========== ХРАНЕНИЕ ==========
  {
    id: 'wardrobe',
    name: 'Шкаф',
    category: 'storage',
    defaultSize: {
      width: 1200,
      depth: 600,
      height: 2200,
    },
    geometryType: 'rectangle',
    sizeConstraints: {
      minWidth: 800,
      maxWidth: 2400,
    },
    positioning: {
      anchorType: 'against-wall',
      allowedRotations: '90',
    },
    visualStyle: {
      fillColor: '#6b5746',
      strokeColor: '#4a3e32',
      strokeWidth: 2,
      iconType: 'wardrobe',
    },
    compatibleRoomTypes: ['bedroom', 'hallway'],
  },
  {
    id: 'chest',
    name: 'Комод',
    category: 'storage',
    defaultSize: {
      width: 1200,
      depth: 500,
      height: 900,
    },
    geometryType: 'rectangle',
    positioning: {
      anchorType: 'against-wall',
      allowedRotations: '90',
    },
    visualStyle: {
      fillColor: '#8b7355',
      strokeColor: '#6b5746',
      strokeWidth: 2,
      iconType: 'chest',
    },
    compatibleRoomTypes: ['bedroom', 'living-room'],
  },
  {
    id: 'nightstand',
    name: 'Тумбочка',
    category: 'storage',
    defaultSize: {
      width: 500,
      depth: 400,
      height: 600,
    },
    geometryType: 'rectangle',
    positioning: {
      anchorType: 'free',
      allowedRotations: '90',
    },
    visualStyle: {
      fillColor: '#a0826d',
      strokeColor: '#8b7355',
      strokeWidth: 2,
      iconType: 'nightstand',
    },
    compatibleRoomTypes: ['bedroom'],
  },

  // ========== СТОЛЫ ==========
  {
    id: 'dining-table',
    name: 'Обеденный стол',
    category: 'tables',
    defaultSize: {
      width: 1400,
      depth: 800,
      height: 750,
    },
    geometryType: 'rectangle',
    sizeConstraints: {
      minWidth: 1000,
      maxWidth: 2000,
      minDepth: 700,
      maxDepth: 1000,
    },
    positioning: {
      anchorType: 'centered-in-room',
      allowedRotations: '90',
    },
    visualStyle: {
      fillColor: '#d4a574',
      strokeColor: '#b8956a',
      strokeWidth: 2,
      iconType: 'table',
    },
    compatibleRoomTypes: ['kitchen', 'dining-room', 'living-room'],
  },
  {
    id: 'coffee-table',
    name: 'Журнальный стол',
    category: 'tables',
    defaultSize: {
      width: 1200,
      depth: 600,
      height: 400,
    },
    geometryType: 'rectangle',
    positioning: {
      anchorType: 'free',
      allowedRotations: '90',
    },
    visualStyle: {
      fillColor: '#c9a961',
      strokeColor: '#a0826d',
      strokeWidth: 2,
      iconType: 'coffee-table',
    },
    compatibleRoomTypes: ['living-room'],
  },
  {
    id: 'desk',
    name: 'Письменный стол',
    category: 'tables',
    defaultSize: {
      width: 1200,
      depth: 600,
      height: 750,
    },
    geometryType: 'rectangle',
    positioning: {
      anchorType: 'against-wall',
      allowedRotations: '90',
    },
    visualStyle: {
      fillColor: '#8b7355',
      strokeColor: '#6b5746',
      strokeWidth: 2,
      iconType: 'desk',
    },
    compatibleRoomTypes: ['bedroom', 'office'],
  },

  // ========== КУХНЯ ==========
  {
    id: 'kitchen-cabinet-base',
    name: 'Кухонный модуль (нижний)',
    category: 'kitchen',
    defaultSize: {
      width: 600,
      depth: 600,
      height: 850,
    },
    geometryType: 'rectangle',
    sizeConstraints: {
      minWidth: 300,
      maxWidth: 900,
    },
    positioning: {
      anchorType: 'against-wall',
      allowedRotations: '90',
    },
    visualStyle: {
      fillColor: '#5d6d7e',
      strokeColor: '#3d4d5e',
      strokeWidth: 2,
      iconType: 'kitchen-cabinet',
    },
    compatibleRoomTypes: ['kitchen'],
  },
  {
    id: 'kitchen-cabinet-wall',
    name: 'Кухонный модуль (навесной)',
    category: 'kitchen',
    defaultSize: {
      width: 600,
      depth: 350,
      height: 700,
    },
    geometryType: 'rectangle',
    positioning: {
      anchorType: 'against-wall',
      allowedRotations: '90',
    },
    visualStyle: {
      fillColor: '#7d8d9e',
      strokeColor: '#5d6d7e',
      strokeWidth: 2,
      iconType: 'kitchen-cabinet-wall',
    },
    compatibleRoomTypes: ['kitchen'],
  },
  {
    id: 'refrigerator',
    name: 'Холодильник',
    category: 'kitchen',
    defaultSize: {
      width: 600,
      depth: 650,
      height: 1900,
    },
    geometryType: 'rectangle',
    positioning: {
      anchorType: 'against-wall',
      allowedRotations: '90',
    },
    visualStyle: {
      fillColor: '#ffffff',
      strokeColor: '#c0c0c0',
      strokeWidth: 2,
      iconType: 'refrigerator',
    },
    compatibleRoomTypes: ['kitchen'],
  },
  {
    id: 'dishwasher',
    name: 'Посудомойка',
    category: 'kitchen',
    defaultSize: {
      width: 600,
      depth: 600,
      height: 850,
    },
    geometryType: 'rectangle',
    positioning: {
      anchorType: 'against-wall',
      allowedRotations: '90',
    },
    visualStyle: {
      fillColor: '#e5e5e5',
      strokeColor: '#c0c0c0',
      strokeWidth: 2,
      iconType: 'dishwasher',
    },
    compatibleRoomTypes: ['kitchen'],
  },

  // ========== САНТЕХНИКА ==========
  {
    id: 'toilet',
    name: 'Унитаз',
    category: 'bathroom',
    defaultSize: {
      width: 400,
      depth: 700,
      height: 400,
    },
    geometryType: 'complex',
    positioning: {
      anchorType: 'against-wall',
      allowedRotations: 'any',
      minDistanceFromWall: 150,
    },
    visualStyle: {
      fillColor: '#ffffff',
      strokeColor: '#c0c0c0',
      strokeWidth: 2,
      iconType: 'toilet',
    },
    compatibleRoomTypes: ['bathroom', 'toilet'],
  },
  {
    id: 'sink',
    name: 'Раковина',
    category: 'bathroom',
    defaultSize: {
      width: 600,
      depth: 500,
      height: 850,
    },
    geometryType: 'complex',
    positioning: {
      anchorType: 'against-wall',
      allowedRotations: '90',
    },
    visualStyle: {
      fillColor: '#ffffff',
      strokeColor: '#c0c0c0',
      strokeWidth: 2,
      iconType: 'sink',
    },
    compatibleRoomTypes: ['bathroom', 'toilet', 'kitchen'],
  },
  {
    id: 'bathtub',
    name: 'Ванна',
    category: 'bathroom',
    defaultSize: {
      width: 1700,
      depth: 700,
      height: 600,
    },
    geometryType: 'complex',
    positioning: {
      anchorType: 'against-wall',
      allowedRotations: '90',
    },
    visualStyle: {
      fillColor: '#e0f2fe',
      strokeColor: '#0284c7',
      strokeWidth: 2,
      iconType: 'bathtub',
    },
    compatibleRoomTypes: ['bathroom'],
  },
  {
    id: 'shower',
    name: 'Душевая кабина',
    category: 'bathroom',
    defaultSize: {
      width: 900,
      depth: 900,
      height: 2100,
    },
    geometryType: 'rectangle',
    positioning: {
      anchorType: 'against-wall',
      allowedRotations: '90',
    },
    visualStyle: {
      fillColor: '#cfe2f3',
      strokeColor: '#0284c7',
      strokeWidth: 2,
      iconType: 'shower',
    },
    compatibleRoomTypes: ['bathroom'],
  },
];

/**
 * Получить элементы каталога по категории
 */
export function getFurnitureByCategory(
  category: FurnitureCatalogItem['category'],
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

