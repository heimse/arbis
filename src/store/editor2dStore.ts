/**
 * Профессиональный Zustand Store для 2D-редактора планировки
 * Поддерживает стены, двери, окна, слои, Undo/Redo
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import {
  PlanData,
  emptyPlan,
  Point,
  Room,
  FurnitureItem,
  PlanRealWorldSize,
  PlanBackgroundImage,
  WallNode,
  Wall,
  Door,
  Window,
  DimensionLine,
  Layer,
  SnapSettings,
} from '@/types/plan';
import { createNode, createWall, updateNodeConnections, removeWall } from '@/lib/editor/walls';
import { findEnclosedArea, createRoom } from '@/lib/editor/rooms';

/**
 * Доступные инструменты редактора
 */
export type EditorTool =
  | 'select'
  | 'wall' // рисование стен
  | 'door' // добавление дверей
  | 'window' // добавление окон
  | 'dimension' // размерные линии
  | 'room' // комнаты (легаси)
  | 'furniture'; // мебель (легаси)

/**
 * Тип выбранного объекта
 */
export type SelectionType = 'node' | 'wall' | 'door' | 'window' | 'dimension' | 'room' | 'furniture' | null;

/**
 * Режим рисования стены
 */
export type WallDrawingMode = {
  active: boolean;
  startNodeId: string | null;
  tempEndPoint: Point | null;
};

/**
 * Режим рисования размерной линии
 */
export type DimensionDrawingMode = {
  active: boolean;
  startPoint: Point | null;
  tempEndPoint: Point | null;
};

/**
 * История изменений для Undo/Redo
 */
type HistoryEntry = {
  plan: PlanData;
  timestamp: number;
};

/**
 * Состояние профессионального 2D-редактора
 */
export type Editor2DState = {
  // Данные планировки
  plan: PlanData;

  // История для Undo/Redo
  history: HistoryEntry[];
  historyIndex: number;
  maxHistory: number;

  // Выбранный объект
  selectedId: string | null;
  selectedType: SelectionType;

  // Текущий инструмент
  tool: EditorTool;

  // Режим рисования стены
  wallDrawing: WallDrawingMode;

  // Режим рисования размерной линии
  dimensionDrawing: DimensionDrawingMode;

  // Камера (масштаб и смещение)
  zoom: number;
  offset: Point;

  // Текущий слой
  activeLayerId: string;

  // Snap
  snapPoint: Point | null;

  // === ACTIONS ===

  // История
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  pushHistory: () => void;

  // Управление планом
  setPlan: (plan: PlanData) => void;
  resetPlan: () => void;

  // Инструменты
  setTool: (tool: EditorTool) => void;

  // Стены и узлы
  startWallDrawing: (point: Point) => void;
  continueWallDrawing: (point: Point) => void;
  finishWallDrawing: () => void;
  cancelWallDrawing: () => void;
  addWall: (startNodeId: string, endNodeId: string, thickness?: number) => void;
  updateWall: (id: string, partial: Partial<Omit<Wall, 'id'>>) => void;
  deleteWall: (id: string) => void;
  moveNode: (id: string, newPosition: Point) => void;
  deleteNode: (id: string) => void;

  // Двери и окна
  addDoor: (wallId: string, position: number, width?: number) => void;
  updateDoor: (id: string, partial: Partial<Omit<Door, 'id'>>) => void;
  deleteDoor: (id: string) => void;
  addWindow: (wallId: string, position: number, width?: number) => void;
  updateWindow: (id: string, partial: Partial<Omit<Window, 'id'>>) => void;
  deleteWindow: (id: string) => void;

  // Размерные линии
  startDimensionDrawing: (point: Point) => void;
  updateDimensionDrawing: (endPoint: Point) => void;
  finishDimensionDrawing: (endPoint: Point) => void;
  cancelDimensionDrawing: () => void;
  addDimension: (start: Point, end: Point) => void;
  updateDimension: (id: string, partial: Partial<Omit<DimensionLine, 'id'>>) => void;
  deleteDimension: (id: string) => void;

  // Слои
  addLayer: (name: string) => void;
  updateLayer: (id: string, partial: Partial<Omit<Layer, 'id'>>) => void;
  deleteLayer: (id: string) => void;
  setActiveLayer: (id: string) => void;
  toggleLayerVisibility: (id: string) => void;
  toggleLayerLock: (id: string) => void;

  // Snap
  setSnapPoint: (point: Point | null) => void;
  updateSnapSettings: (settings: Partial<SnapSettings>) => void;

  // Выделение
  select: (id: string, type: SelectionType) => void;
  clearSelection: () => void;

  // Комнаты и мебель (легаси)
  addRoom: (position: Point) => void;
  updateRoom: (id: string, partial: Partial<Omit<Room, 'id'>>) => void;
  deleteRoom: (id: string) => void;
  addFurniture: (position: Point) => void;
  updateFurniture: (id: string, partial: Partial<Omit<FurnitureItem, 'id'>>) => void;
  deleteFurniture: (id: string) => void;
  
  // Новая система мебели
  addFurnitureInstance: (catalogItemId: string, position: Point, roomId?: string) => void;
  updateFurnitureInstance: (id: string, partial: Partial<Omit<FurnitureInstance, 'id'>>) => void;
  deleteFurnitureInstance: (id: string) => void;
  moveFurnitureInstance: (id: string, newPosition: Point) => void;
  rotateFurnitureInstance: (id: string, deltaRotation: number) => void;
  resizeFurnitureInstance: (id: string, newSize: { width?: number; depth?: number }) => void;

  // Редактирование выбранного
  moveSelected: (delta: Point) => void;
  deleteSelected: () => void;

  // Камера
  setZoom: (zoom: number) => void;
  setOffset: (offset: Point) => void;
  resetView: () => void;

  // Реальные размеры и фон
  setRealWorldSize: (size: PlanRealWorldSize) => void;
  setBackgroundImage: (bg: PlanBackgroundImage | undefined) => void;
  updateBackgroundImage: (patch: Partial<PlanBackgroundImage>) => void;
  toggleBackgroundVisibility: () => void;
  setBackgroundOpacity: (value: number) => void;
};

/**
 * Профессиональный Zustand store для редактора
 */
export const useEditor2DStore = create<Editor2DState>()(
  immer((set, get) => ({
    // ========== НАЧАЛЬНОЕ СОСТОЯНИЕ ==========
    plan: emptyPlan,
    history: [{ plan: emptyPlan, timestamp: Date.now() }],
    historyIndex: 0,
    maxHistory: 50,
    selectedId: null,
    selectedType: null,
    tool: 'select',
    wallDrawing: {
      active: false,
      startNodeId: null,
      tempEndPoint: null,
    },
    dimensionDrawing: {
      active: false,
      startPoint: null,
      tempEndPoint: null,
    },
    zoom: 1,
    offset: { x: 0, y: 0 },
    activeLayerId: 'layer-walls',
    snapPoint: null,

    // ========== ИСТОРИЯ (UNDO/REDO) ==========
    pushHistory: () =>
      set((state) => {
        const newEntry: HistoryEntry = {
          plan: JSON.parse(JSON.stringify(state.plan)),
          timestamp: Date.now(),
        };

        // Удаляем всё после текущего индекса
        state.history = state.history.slice(0, state.historyIndex + 1);

        // Добавляем новую запись
        state.history.push(newEntry);

        // Ограничиваем размер истории
        if (state.history.length > state.maxHistory) {
          state.history.shift();
        } else {
          state.historyIndex++;
        }
      }),

    undo: () =>
      set((state) => {
        if (state.historyIndex > 0) {
          state.historyIndex--;
          state.plan = JSON.parse(JSON.stringify(state.history[state.historyIndex].plan));
          state.selectedId = null;
          state.selectedType = null;
        }
      }),

    redo: () =>
      set((state) => {
        if (state.historyIndex < state.history.length - 1) {
          state.historyIndex++;
          state.plan = JSON.parse(JSON.stringify(state.history[state.historyIndex].plan));
          state.selectedId = null;
          state.selectedType = null;
        }
      }),

    canUndo: () => get().historyIndex > 0,
    canRedo: () => get().historyIndex < get().history.length - 1,

    // ========== УПРАВЛЕНИЕ ПЛАНОМ ==========
    setPlan: (plan) =>
      set((state) => {
        state.plan = plan;
        state.history = [{ plan: JSON.parse(JSON.stringify(plan)), timestamp: Date.now() }];
        state.historyIndex = 0;
      }),

    resetPlan: () =>
      set((state) => {
        state.plan = JSON.parse(JSON.stringify(emptyPlan));
        state.history = [{ plan: emptyPlan, timestamp: Date.now() }];
        state.historyIndex = 0;
        state.selectedId = null;
        state.selectedType = null;
      }),

    // ========== ИНСТРУМЕНТЫ ==========
    setTool: (tool) =>
      set((state) => {
        state.tool = tool;
        // Сбрасываем режим рисования стены при смене инструмента
        if (tool !== 'wall') {
          state.wallDrawing = {
            active: false,
            startNodeId: null,
            tempEndPoint: null,
          };
        }
        // Сбрасываем режим рисования размерной линии при смене инструмента
        if (tool !== 'dimension') {
          state.dimensionDrawing = {
            active: false,
            startPoint: null,
            tempEndPoint: null,
          };
        }
      }),

    // ========== СТЕНЫ И УЗЛЫ ==========
    startWallDrawing: (point) =>
      set((state) => {
        // Создаём начальный узел
        const startNode = createNode(point);
        state.plan.nodes.push(startNode);

        state.wallDrawing = {
          active: true,
          startNodeId: startNode.id,
          tempEndPoint: point,
        };
      }),

    continueWallDrawing: (point) =>
      set((state) => {
        if (!state.wallDrawing.active || !state.wallDrawing.startNodeId) return;

        // Создаём конечный узел и стену
        const endNode = createNode(point);
        state.plan.nodes.push(endNode);

        const wall = createWall(
          state.wallDrawing.startNodeId,
          endNode.id,
          200, // 200мм по умолчанию
          'interior',
          state.activeLayerId
        );
        state.plan.walls.push(wall);

        // Обновляем связи
        state.plan.nodes = updateNodeConnections(
          state.wallDrawing.startNodeId,
          state.plan.nodes,
          state.plan.walls
        );
        state.plan.nodes = updateNodeConnections(
          endNode.id,
          state.plan.nodes,
          state.plan.walls
        );

        // Начинаем следующую стену от этого узла
        state.wallDrawing.startNodeId = endNode.id;
        state.wallDrawing.tempEndPoint = point;

        get().pushHistory();
      }),

    finishWallDrawing: () =>
      set((state) => {
        state.wallDrawing = {
          active: false,
          startNodeId: null,
          tempEndPoint: null,
        };
      }),

    cancelWallDrawing: () =>
      set((state) => {
        // Удаляем начальный узел если он не связан со стенами
        if (state.wallDrawing.startNodeId) {
          const node = state.plan.nodes.find((n) => n.id === state.wallDrawing.startNodeId);
          if (node && node.connectedWallIds.length === 0) {
            state.plan.nodes = state.plan.nodes.filter((n) => n.id !== node.id);
          }
        }

        state.wallDrawing = {
          active: false,
          startNodeId: null,
          tempEndPoint: null,
        };
      }),

    addWall: (startNodeId, endNodeId, thickness = 200) =>
      set((state) => {
        const wall = createWall(startNodeId, endNodeId, thickness, 'interior', state.activeLayerId);
        state.plan.walls.push(wall);

        // Обновляем связи узлов
        state.plan.nodes = updateNodeConnections(startNodeId, state.plan.nodes, state.plan.walls);
        state.plan.nodes = updateNodeConnections(endNodeId, state.plan.nodes, state.plan.walls);

        get().pushHistory();
      }),

    updateWall: (id, partial) =>
      set((state) => {
        const wall = state.plan.walls.find((w) => w.id === id);
        if (wall) {
          Object.assign(wall, partial);
          // Не сохраняем в историю, если это только изменение толщины или типа
          // История будет сохранена только при геометрических изменениях
        }
      }),

    deleteWall: (id) =>
      set((state) => {
        const result = removeWall(id, state.plan.walls, state.plan.nodes);
        state.plan.walls = result.walls;
        state.plan.nodes = result.nodes;

        // Удаляем двери и окна этой стены
        state.plan.doors = state.plan.doors.filter((d) => d.wallId !== id);
        state.plan.windows = state.plan.windows.filter((w) => w.wallId !== id);

        get().pushHistory();
      }),

    moveNode: (id, newPosition) =>
      set((state) => {
        const node = state.plan.nodes.find((n) => n.id === id);
        if (node) {
          node.position = newPosition;
          get().pushHistory();
        }
      }),

    deleteNode: (id) =>
      set((state) => {
        // Удаляем все стены, связанные с узлом
        const connectedWalls = state.plan.walls.filter(
          (w) => w.startNodeId === id || w.endNodeId === id
        );

        for (const wall of connectedWalls) {
          get().deleteWall(wall.id);
        }

        // Удаляем узел
        state.plan.nodes = state.plan.nodes.filter((n) => n.id !== id);

        get().pushHistory();
      }),

    // ========== ДВЕРИ ==========
    addDoor: (wallId, position, width = 900) =>
      set((state) => {
        const door: Door = {
          id: nanoid(),
          wallId,
          position,
          width,
          height: 2100,
          type: 'single',
          openingAngle: 90,
          openingDirection: 'left',
          layerId: 'layer-openings',
        };
        state.plan.doors.push(door);
        get().pushHistory();
      }),

    updateDoor: (id, partial) =>
      set((state) => {
        const door = state.plan.doors.find((d) => d.id === id);
        if (door) {
          Object.assign(door, partial);
          get().pushHistory();
        }
      }),

    deleteDoor: (id) =>
      set((state) => {
        state.plan.doors = state.plan.doors.filter((d) => d.id !== id);
        get().pushHistory();
      }),

    // ========== ОКНА ==========
    addWindow: (wallId, position, width = 1200) =>
      set((state) => {
        const window: Window = {
          id: nanoid(),
          wallId,
          position,
          width,
          height: 1400,
          sillHeight: 900,
          layerId: 'layer-openings',
        };
        state.plan.windows.push(window);
        get().pushHistory();
      }),

    updateWindow: (id, partial) =>
      set((state) => {
        const window = state.plan.windows.find((w) => w.id === id);
        if (window) {
          Object.assign(window, partial);
          get().pushHistory();
        }
      }),

    deleteWindow: (id) =>
      set((state) => {
        state.plan.windows = state.plan.windows.filter((w) => w.id !== id);
        get().pushHistory();
      }),

    // ========== РАЗМЕРНЫЕ ЛИНИИ ==========
    startDimensionDrawing: (point) =>
      set((state) => {
        state.dimensionDrawing = {
          active: true,
          startPoint: point,
          tempEndPoint: point,
        };
      }),

    updateDimensionDrawing: (endPoint) =>
      set((state) => {
        if (state.dimensionDrawing.active) {
          state.dimensionDrawing.tempEndPoint = endPoint;
        }
      }),

    finishDimensionDrawing: (endPoint) =>
      set((state) => {
        if (state.dimensionDrawing.active && state.dimensionDrawing.startPoint) {
          const dimension: DimensionLine = {
            id: nanoid(),
            startPoint: state.dimensionDrawing.startPoint,
            endPoint: endPoint,
            offset: 50,
            layerId: 'layer-dimensions',
          };
          state.plan.dimensions.push(dimension);
          get().pushHistory();
        }

        state.dimensionDrawing = {
          active: false,
          startPoint: null,
          tempEndPoint: null,
        };
      }),

    cancelDimensionDrawing: () =>
      set((state) => {
        state.dimensionDrawing = {
          active: false,
          startPoint: null,
          tempEndPoint: null,
        };
      }),

    addDimension: (start, end) =>
      set((state) => {
        const dimension: DimensionLine = {
          id: nanoid(),
          startPoint: start,
          endPoint: end,
          offset: 50,
          layerId: 'layer-dimensions',
        };
        state.plan.dimensions.push(dimension);
        get().pushHistory();
      }),

    updateDimension: (id, partial) =>
      set((state) => {
        const dimension = state.plan.dimensions.find((d) => d.id === id);
        if (dimension) {
          Object.assign(dimension, partial);
          get().pushHistory();
        }
      }),

    deleteDimension: (id) =>
      set((state) => {
        state.plan.dimensions = state.plan.dimensions.filter((d) => d.id !== id);
        get().pushHistory();
      }),

    // ========== СЛОИ ==========
    addLayer: (name) =>
      set((state) => {
        const newLayer: Layer = {
          id: nanoid(),
          name,
          visible: true,
          locked: false,
          opacity: 1,
          color: '#' + Math.floor(Math.random() * 16777215).toString(16),
          order: state.plan.layers.length,
        };
        state.plan.layers.push(newLayer);
        get().pushHistory();
      }),

    updateLayer: (id, partial) =>
      set((state) => {
        const layer = state.plan.layers.find((l) => l.id === id);
        if (layer) {
          Object.assign(layer, partial);
        }
      }),

    deleteLayer: (id) =>
      set((state) => {
        // Нельзя удалить все слои
        if (state.plan.layers.length <= 1) return;

        state.plan.layers = state.plan.layers.filter((l) => l.id !== id);

        // Переносим объекты удалённого слоя на первый оставшийся
        const firstLayer = state.plan.layers[0];
        state.plan.walls.forEach((w) => {
          if (w.layerId === id) w.layerId = firstLayer.id;
        });
        state.plan.doors.forEach((d) => {
          if (d.layerId === id) d.layerId = firstLayer.id;
        });
        state.plan.windows.forEach((w) => {
          if (w.layerId === id) w.layerId = firstLayer.id;
        });
        state.plan.dimensions.forEach((d) => {
          if (d.layerId === id) d.layerId = firstLayer.id;
        });

        get().pushHistory();
      }),

    setActiveLayer: (id) =>
      set((state) => {
        state.activeLayerId = id;
      }),

    toggleLayerVisibility: (id) =>
      set((state) => {
        const layer = state.plan.layers.find((l) => l.id === id);
        if (layer) {
          layer.visible = !layer.visible;
        }
      }),

    toggleLayerLock: (id) =>
      set((state) => {
        const layer = state.plan.layers.find((l) => l.id === id);
        if (layer) {
          layer.locked = !layer.locked;
        }
      }),

    // ========== SNAP ==========
    setSnapPoint: (point) =>
      set((state) => {
        state.snapPoint = point;
      }),

    updateSnapSettings: (settings) =>
      set((state) => {
        Object.assign(state.plan.snapSettings, settings);
      }),

    // ========== ВЫДЕЛЕНИЕ ==========
    select: (id, type) =>
      set((state) => {
        state.selectedId = id;
        state.selectedType = type;
      }),

    clearSelection: () =>
      set((state) => {
        state.selectedId = null;
        state.selectedType = null;
      }),

    // ========== КОМНАТЫ ==========
    addRoom: (position) =>
      set((state) => {
        // Ищем замкнутую область стен, содержащую точку клика
        const enclosedArea = findEnclosedArea(
          position,
          state.plan.walls,
          state.plan.nodes
        );

        if (!enclosedArea) {
          // Не удалось найти замкнутую область
          // Можно показать уведомление пользователю
          console.warn('Невозможно создать комнату: замкнутая область не найдена. Проверьте, что стены соединены узлами.');
          return;
        }

        // Находим слой для комнат
        const roomsLayer = state.plan.layers.find((l) => l.id === 'layer-rooms');
        const layerId = roomsLayer?.id || 'layer-rooms';

        // Создаём комнату
        const pixelsPerMeter = state.plan.realWorldSize?.pixelsPerMeter || 80;
        const newRoom = createRoom(
          enclosedArea.polygon,
          enclosedArea.wallIds,
          pixelsPerMeter,
          layerId
        );

        state.plan.rooms.push(newRoom);
        state.selectedId = newRoom.id;
        state.selectedType = 'room';
        get().pushHistory();
      }),

    updateRoom: (id, partial) =>
      set((state) => {
        const room = state.plan.rooms.find((r) => r.id === id);
        if (room) {
          Object.assign(room, partial);
          get().pushHistory();
        }
      }),

    deleteRoom: (id) =>
      set((state) => {
        state.plan.rooms = state.plan.rooms.filter((r) => r.id !== id);
        get().pushHistory();
      }),

    // ========== МЕБЕЛЬ (ЛЕГАСИ) ==========
    addFurniture: (position) =>
      set((state) => {
        const newFurniture: FurnitureItem = {
          id: nanoid(),
          type: 'furniture',
          position: {
            x: position.x - 100,
            y: position.y - 50,
          },
          size: { width: 200, height: 100 },
          rotation: 0,
        };
        state.plan.furniture.push(newFurniture);
        state.selectedId = newFurniture.id;
        state.selectedType = 'furniture';
        get().pushHistory();
      }),

    updateFurniture: (id, partial) =>
      set((state) => {
        const furniture = state.plan.furniture.find((f) => f.id === id);
        if (furniture) {
          Object.assign(furniture, partial);
          get().pushHistory();
        }
      }),

    deleteFurniture: (id) =>
      set((state) => {
        state.plan.furniture = state.plan.furniture.filter((f) => f.id !== id);
        get().pushHistory();
      }),

    // ========== РЕДАКТИРОВАНИЕ ВЫБРАННОГО ==========
    moveSelected: (delta) =>
      set((state) => {
        const { selectedId, selectedType } = state;
        if (!selectedId || !selectedType) return;

        if (selectedType === 'node') {
          const node = state.plan.nodes.find((n) => n.id === selectedId);
          if (node) {
            node.position.x += delta.x;
            node.position.y += delta.y;
          }
        } else if (selectedType === 'room') {
          const room = state.plan.rooms.find((r) => r.id === selectedId);
          if (room) {
            room.position.x += delta.x;
            room.position.y += delta.y;
          }
        } else if (selectedType === 'furniture') {
          const furniture = state.plan.furniture.find((f) => f.id === selectedId);
          if (furniture) {
            furniture.position.x += delta.x;
            furniture.position.y += delta.y;
          }
        }

        get().pushHistory();
      }),

    deleteSelected: () =>
      set((state) => {
        const { selectedId, selectedType } = state;
        if (!selectedId || !selectedType) return;

        if (selectedType === 'node') {
          get().deleteNode(selectedId);
        } else if (selectedType === 'wall') {
          get().deleteWall(selectedId);
        } else if (selectedType === 'door') {
          get().deleteDoor(selectedId);
        } else if (selectedType === 'window') {
          get().deleteWindow(selectedId);
        } else if (selectedType === 'dimension') {
          get().deleteDimension(selectedId);
        } else if (selectedType === 'room') {
          get().deleteRoom(selectedId);
        } else if (selectedType === 'furniture') {
          get().deleteFurniture(selectedId);
        }

        state.selectedId = null;
        state.selectedType = null;
      }),

    // ========== КАМЕРА ==========
    setZoom: (zoom) =>
      set((state) => {
        state.zoom = Math.max(0.1, Math.min(5, zoom));
      }),

    setOffset: (offset) =>
      set((state) => {
        state.offset = offset;
      }),

    resetView: () =>
      set((state) => {
        state.zoom = 1;
        state.offset = { x: 0, y: 0 };
      }),

    // ========== РЕАЛЬНЫЕ РАЗМЕРЫ И ФОН ==========
    setRealWorldSize: (size) =>
      set((state) => {
        state.plan.realWorldSize = size;
      }),

    setBackgroundImage: (bg) =>
      set((state) => {
        state.plan.backgroundImage = bg;
      }),

    updateBackgroundImage: (patch) =>
      set((state) => {
        if (state.plan.backgroundImage) {
          Object.assign(state.plan.backgroundImage, patch);
        }
      }),

    toggleBackgroundVisibility: () =>
      set((state) => {
        if (state.plan.backgroundImage) {
          state.plan.backgroundImage.visible = !state.plan.backgroundImage.visible;
        }
      }),

    setBackgroundOpacity: (value) =>
      set((state) => {
        if (state.plan.backgroundImage) {
          state.plan.backgroundImage.opacity = Math.max(0, Math.min(1, value));
        }
      }),
  }))
);

