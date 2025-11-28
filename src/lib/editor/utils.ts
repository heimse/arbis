// Утилиты для редактора

/**
 * Генерирует уникальный ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Генерирует ID для узла
 */
export function generateNodeId(): string {
  return `node-${generateId()}`
}

/**
 * Генерирует ID для стены
 */
export function generateWallId(): string {
  return `wall-${generateId()}`
}

/**
 * Генерирует ID для двери
 */
export function generateDoorId(): string {
  return `door-${generateId()}`
}

/**
 * Генерирует ID для окна
 */
export function generateWindowId(): string {
  return `window-${generateId()}`
}

/**
 * Генерирует ID для комнаты
 */
export function generateRoomId(): string {
  return `room-${generateId()}`
}

/**
 * Генерирует ID для мебели
 */
export function generateFurnitureId(): string {
  return `furniture-${generateId()}`
}

/**
 * Генерирует ID для размерной линии
 */
export function generateDimensionId(): string {
  return `dimension-${generateId()}`
}

/**
 * Генерирует ID для слоя
 */
export function generateLayerId(): string {
  return `layer-${generateId()}`
}

/**
 * Дефолтные слои
 */
export const DEFAULT_LAYERS = [
  {
    id: 'layer-rooms',
    name: 'Комнаты',
    visible: true,
    locked: false,
    color: '#3b82f6',
  },
  {
    id: 'layer-walls',
    name: 'Стены',
    visible: true,
    locked: false,
    color: '#1f2937',
  },
  {
    id: 'layer-openings',
    name: 'Проёмы',
    visible: true,
    locked: false,
    color: '#3b82f6',
  },
  {
    id: 'layer-furniture',
    name: 'Мебель',
    visible: true,
    locked: false,
    color: '#10b981',
  },
  {
    id: 'layer-dimensions',
    name: 'Размеры',
    visible: true,
    locked: false,
    color: '#6366f1',
  },
]

/**
 * Дефолтные настройки сетки
 */
export const DEFAULT_GRID_SETTINGS = {
  visible: true,
  spacing: 0.5, // 0.5 метра
  subdivisions: 5,
  color: '#e5e7eb',
  majorColor: '#d1d5db',
}

/**
 * Дефолтные настройки snap
 */
export const DEFAULT_SNAP_MODE = {
  toGrid: true,
  toNodes: true,
  toWallMidpoints: true,
  toOrthogonal: true,
}

/**
 * Дефолтные настройки камеры
 */
export const DEFAULT_CAMERA = {
  x: 0,
  y: 0,
  zoom: 50, // 50 пикселей на метр
}

/**
 * Дефолтные настройки плана
 */
export const DEFAULT_PLAN_SETTINGS = {
  width: 20,
  height: 20,
  units: 'meters' as const,
  scale: 50, // 1:50
}

/**
 * Дефолтная толщина стены в мм
 */
export const DEFAULT_WALL_THICKNESS = {
  'load-bearing': 300, // несущая стена
  'partition': 100, // перегородка
}

/**
 * Дефолтные размеры проёмов в мм
 */
export const DEFAULT_DOOR_SIZE = {
  width: 900,
  height: 2100,
}

export const DEFAULT_WINDOW_SIZE = {
  width: 1200,
  height: 1400,
  sillHeight: 800,
}

/**
 * Пороги для snap (в мировых координатах - метрах)
 */
export const SNAP_THRESHOLD = {
  node: 0.2, // 20 см
  wall: 0.1, // 10 см
  grid: 0.05, // 5 см
}

/**
 * Клонирует объект глубоко
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * Проверяет, нажата ли клавиша Ctrl/Cmd
 */
export function isModifierKey(event: KeyboardEvent | MouseEvent): boolean {
  return event.ctrlKey || event.metaKey
}

/**
 * Проверяет, нажата ли клавиша Shift
 */
export function isShiftKey(event: KeyboardEvent | MouseEvent): boolean {
  return event.shiftKey
}

/**
 * Дебаунс функция
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle функция
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

