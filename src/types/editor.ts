// Базовые типы для 2D редактора планов

export type Point = {
  x: number
  y: number
}

export type NodeId = string
export type WallId = string
export type DoorId = string
export type WindowId = string
export type LayerId = string

// Узел (точка соединения стен)
export type Node = {
  id: NodeId
  x: number // в метрах
  y: number // в метрах
  connectedWalls: WallId[]
}

// Тип стены
export type WallType = 'load-bearing' | 'partition'

// Стена (отрезок между двумя узлами)
export type Wall = {
  id: WallId
  startNodeId: NodeId
  endNodeId: NodeId
  type: WallType
  thickness: number // в мм
  layerId: LayerId
}

// Тип проёма
export type OpeningType = 'door' | 'window'

// Дверь
export type Door = {
  id: DoorId
  wallId: WallId
  position: number // позиция вдоль стены от 0 до 1
  width: number // в мм
  height: number // в мм
  openDirection: 'left' | 'right' // направление открывания
  layerId: LayerId
}

// Окно
export type Window = {
  id: WindowId
  wallId: WallId
  position: number // позиция вдоль стены от 0 до 1
  width: number // в мм
  height: number // в мм
  sillHeight: number // высота подоконника в мм
  layerId: LayerId
}

// Слой
export type Layer = {
  id: LayerId
  name: string
  visible: boolean
  locked: boolean
  color: string
}

// Фоновое изображение
export type BackgroundImage = {
  url: string
  scale: number // пикселей на метр
  offsetX: number // в пикселях
  offsetY: number // в пикселях
  opacity: number // от 0 до 1
  visible: boolean
  realWidth?: number // реальная ширина в метрах для калибровки
  realHeight?: number // реальная высота в метрах для калибровки
}

// Инструменты редактора
export type Tool = 
  | 'select'
  | 'wall'
  | 'door'
  | 'window'
  | 'dimension'
  | 'room'
  | 'furniture'

// Режим привязки
export type SnapMode = {
  toGrid: boolean
  toNodes: boolean
  toWallMidpoints: boolean
  toOrthogonal: boolean
}

// Настройки сетки
export type GridSettings = {
  visible: boolean
  spacing: number // в метрах
  subdivisions: number // количество подразделений
  color: string
  majorColor: string
}

// Камера (viewport)
export type Camera = {
  x: number // позиция в мировых координатах
  y: number // позиция в мировых координатах
  zoom: number // масштаб (пикселей на метр)
}

// Выделение
export type Selection = {
  type: 'node' | 'wall' | 'door' | 'window' | null
  id: string | null
}

// Состояние рисования стены
export type WallDrawingState = {
  isDrawing: boolean
  nodes: NodeId[]
}

// Единицы измерения
export type Units = 'meters' | 'millimeters'

// Настройки плана
export type PlanSettings = {
  width: number // в метрах
  height: number // в метрах
  units: Units
  scale: number // масштаб отображения (например, 1:50)
}

// Снапшот для истории
export type HistorySnapshot = {
  nodes: Map<NodeId, Node>
  walls: Map<WallId, Wall>
  doors: Map<DoorId, Door>
  windows: Map<WindowId, Window>
  timestamp: number
}

// Полное состояние редактора
export type EditorState = {
  // Данные
  nodes: Map<NodeId, Node>
  walls: Map<WallId, Wall>
  doors: Map<DoorId, Door>
  windows: Map<WindowId, Window>
  layers: Map<LayerId, Layer>
  
  // Настройки
  planSettings: PlanSettings
  gridSettings: GridSettings
  snapMode: SnapMode
  backgroundImage: BackgroundImage | null
  
  // UI состояние
  activeTool: Tool
  selection: Selection
  camera: Camera
  wallDrawingState: WallDrawingState
  isDragging: boolean // Флаг для группировки действий drag
  
  // История
  history: HistorySnapshot[]
  historyIndex: number
}

// Вспомогательные типы для рендеринга
export type CanvasRenderContext = {
  ctx: CanvasRenderingContext2D
  camera: Camera
  pixelsPerMeter: number
}

