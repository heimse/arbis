// Система истории для Undo/Redo

import type { EditorState, Node, Wall, Door, Window, Room, Furniture, Dimension } from '@/types/editor'

// Снапшот состояния для истории
export type HistorySnapshot = {
  nodes: Map<string, Node>
  walls: Map<string, Wall>
  doors: Map<string, Door>
  windows: Map<string, Window>
  rooms: Map<string, Room>
  furniture: Map<string, Furniture>
  dimensions: Map<string, Dimension>
  timestamp: number
}

// Максимальный размер истории
const MAX_HISTORY_SIZE = 50

/**
 * Создаёт снапшот текущего состояния
 */
export function createSnapshot(state: EditorState): HistorySnapshot {
  return {
    nodes: new Map(state.nodes),
    walls: new Map(state.walls),
    doors: new Map(state.doors),
    windows: new Map(state.windows),
    rooms: new Map(state.rooms),
    furniture: new Map(state.furniture),
    dimensions: new Map(state.dimensions),
    timestamp: Date.now(),
  }
}

/**
 * Восстанавливает состояние из снапшота
 */
export function restoreSnapshot(
  state: EditorState,
  snapshot: HistorySnapshot
): EditorState {
  return {
    ...state,
    nodes: new Map(snapshot.nodes),
    walls: new Map(snapshot.walls),
    doors: new Map(snapshot.doors),
    windows: new Map(snapshot.windows),
    rooms: new Map(snapshot.rooms),
    furniture: new Map(snapshot.furniture),
    dimensions: new Map(snapshot.dimensions),
  }
}

/**
 * Проверяет, нужно ли сохранять действие в историю
 */
export function shouldSaveToHistory(actionType: string): boolean {
  const saveableActions = [
    'ADD_NODE',
    'UPDATE_NODE',
    'DELETE_NODE',
    'ADD_WALL',
    'UPDATE_WALL',
    'DELETE_WALL',
    'ADD_DOOR',
    'UPDATE_DOOR',
    'DELETE_DOOR',
    'ADD_WINDOW',
    'UPDATE_WINDOW',
    'DELETE_WINDOW',
    'ADD_ROOM',
    'UPDATE_ROOM',
    'DELETE_ROOM',
    'ADD_FURNITURE',
    'UPDATE_FURNITURE',
    'DELETE_FURNITURE',
    'ADD_DIMENSION',
    'UPDATE_DIMENSION',
    'DELETE_DIMENSION',
  ]
  
  return saveableActions.includes(actionType)
}

/**
 * Добавляет снапшот в историю
 */
export function addToHistory(
  history: HistorySnapshot[],
  historyIndex: number,
  snapshot: HistorySnapshot
): { history: HistorySnapshot[]; historyIndex: number } {
  // Обрезаем историю до текущего индекса (удаляем "будущее" при новом действии)
  const newHistory = history.slice(0, historyIndex + 1)
  
  // Добавляем новый снапшот
  newHistory.push(snapshot)
  
  // Ограничиваем размер истории
  if (newHistory.length > MAX_HISTORY_SIZE) {
    newHistory.shift()
    return {
      history: newHistory,
      historyIndex: newHistory.length - 1,
    }
  }
  
  return {
    history: newHistory,
    historyIndex: newHistory.length - 1,
  }
}

/**
 * Проверяет возможность Undo
 */
export function canUndo(historyIndex: number): boolean {
  return historyIndex > 0
}

/**
 * Проверяет возможность Redo
 */
export function canRedo(historyIndex: number, historyLength: number): boolean {
  return historyIndex < historyLength - 1
}

