'use client'

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import type {
  EditorState,
  Tool,
  Node,
  Wall,
  Door,
  Window,
  Room,
  Furniture,
  Dimension,
  Layer,
  Selection,
  BackgroundImage,
  Point,
} from '@/types/editor'
import {
  DEFAULT_LAYERS,
  DEFAULT_GRID_SETTINGS,
  DEFAULT_SNAP_MODE,
  DEFAULT_CAMERA,
  DEFAULT_PLAN_SETTINGS,
  generateNodeId,
  generateWallId,
  generateDoorId,
  generateWindowId,
  generateRoomId,
  generateFurnitureId,
  generateDimensionId,
  DEFAULT_WALL_THICKNESS,
  DEFAULT_DOOR_SIZE,
  DEFAULT_WINDOW_SIZE,
} from '@/lib/editor/utils'
import {
  createSnapshot,
  restoreSnapshot,
  shouldSaveToHistory,
  addToHistory,
  canUndo,
  canRedo,
} from '@/lib/editor/history'

// Типы действий
type EditorAction =
  | { type: 'SET_TOOL'; tool: Tool }
  | { type: 'SET_SELECTION'; selection: Selection }
  | { type: 'ADD_NODE'; node: Node }
  | { type: 'UPDATE_NODE'; id: string; updates: Partial<Node> }
  | { type: 'DELETE_NODE'; id: string }
  | { type: 'ADD_WALL'; wall: Wall }
  | { type: 'UPDATE_WALL'; id: string; updates: Partial<Wall> }
  | { type: 'DELETE_WALL'; id: string }
  | { type: 'ADD_DOOR'; door: Door }
  | { type: 'UPDATE_DOOR'; id: string; updates: Partial<Door> }
  | { type: 'DELETE_DOOR'; id: string }
  | { type: 'ADD_WINDOW'; window: Window }
  | { type: 'UPDATE_WINDOW'; id: string; updates: Partial<Window> }
  | { type: 'DELETE_WINDOW'; id: string }
  | { type: 'ADD_ROOM'; room: Room }
  | { type: 'UPDATE_ROOM'; id: string; updates: Partial<Room> }
  | { type: 'DELETE_ROOM'; id: string }
  | { type: 'ADD_FURNITURE'; furniture: Furniture }
  | { type: 'UPDATE_FURNITURE'; id: string; updates: Partial<Furniture> }
  | { type: 'DELETE_FURNITURE'; id: string }
  | { type: 'ADD_DIMENSION'; dimension: Dimension }
  | { type: 'UPDATE_DIMENSION'; id: string; updates: Partial<Dimension> }
  | { type: 'DELETE_DIMENSION'; id: string }
  | { type: 'UPDATE_LAYER'; id: string; updates: Partial<Layer> }
  | { type: 'SET_CAMERA'; camera: Partial<typeof DEFAULT_CAMERA> }
  | { type: 'SET_BACKGROUND'; background: BackgroundImage | null }
  | { type: 'START_WALL_DRAWING' }
  | { type: 'ADD_WALL_NODE'; nodeId: string }
  | { type: 'FINISH_WALL_DRAWING' }
  | { type: 'CANCEL_WALL_DRAWING' }
  | { type: 'START_DIMENSION_DRAWING'; startPoint: Point }
  | { type: 'UPDATE_DIMENSION_DRAWING'; endPoint: Point }
  | { type: 'FINISH_DIMENSION_DRAWING' }
  | { type: 'CANCEL_DIMENSION_DRAWING' }
  | { type: 'START_ROOM_SELECTION'; startPoint: Point }
  | { type: 'UPDATE_ROOM_SELECTION'; endPoint: Point }
  | { type: 'FINISH_ROOM_SELECTION' }
  | { type: 'CANCEL_ROOM_SELECTION' }
  | { type: 'START_DRAG' }
  | { type: 'END_DRAG'; cancel?: boolean }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'CLEAR_ALL' }

// Создаём начальный снапшот
const initialSnapshot = {
  nodes: new Map(),
  walls: new Map(),
  doors: new Map(),
  windows: new Map(),
  rooms: new Map(),
  furniture: new Map(),
  dimensions: new Map(),
  timestamp: Date.now(),
}

// Начальное состояние
const initialState: EditorState = {
  nodes: new Map(),
  walls: new Map(),
  doors: new Map(),
  windows: new Map(),
  rooms: new Map(),
  furniture: new Map(),
  dimensions: new Map(),
  layers: new Map(DEFAULT_LAYERS.map((layer) => [layer.id, layer])),
  planSettings: DEFAULT_PLAN_SETTINGS,
  gridSettings: DEFAULT_GRID_SETTINGS,
  snapMode: DEFAULT_SNAP_MODE,
  backgroundImage: null,
  activeTool: 'select',
  selection: { type: null, id: null },
  camera: DEFAULT_CAMERA,
  wallDrawingState: {
    isDrawing: false,
    nodes: [],
  },
  dimensionDrawingState: {
    isDrawing: false,
    startPoint: null,
    tempEndPoint: null,
  },
  roomSelectionState: {
    isSelecting: false,
    startPoint: null,
    endPoint: null,
  },
  isDragging: false,
  history: [initialSnapshot],
  historyIndex: 0,
}

// Reducer
function editorReducer(state: EditorState, action: EditorAction): EditorState {
  // Сохраняем снапшот перед изменяющими действиями
  // НО: не сохраняем во время drag (кроме начала и конца)
  let newState = state
  
  if (shouldSaveToHistory(action.type) && !state.isDragging) {
    const snapshot = createSnapshot(state)
    const { history, historyIndex } = addToHistory(
      state.history,
      state.historyIndex,
      snapshot
    )
    newState = {
      ...state,
      history,
      historyIndex,
    }
  }
  
  switch (action.type) {
    case 'SET_TOOL':
      return {
        ...newState,
        activeTool: action.tool,
        wallDrawingState: {
          isDrawing: false,
          nodes: [],
        },
        dimensionDrawingState: {
          isDrawing: false,
          startPoint: null,
          tempEndPoint: null,
        },
        roomSelectionState: {
          isSelecting: false,
          startPoint: null,
          endPoint: null,
        },
      }

    case 'SET_SELECTION':
      return {
        ...newState,
        selection: action.selection,
      }

    case 'ADD_NODE': {
      const newNodes = new Map(newState.nodes)
      newNodes.set(action.node.id, action.node)
      return {
        ...newState,
        nodes: newNodes,
      }
    }

    case 'UPDATE_NODE': {
      const node = newState.nodes.get(action.id)
      if (!node) return newState

      const newNodes = new Map(newState.nodes)
      newNodes.set(action.id, { ...node, ...action.updates })
      return {
        ...newState,
        nodes: newNodes,
      }
    }

    case 'DELETE_NODE': {
      const newNodes = new Map(newState.nodes)
      newNodes.delete(action.id)
      return {
        ...newState,
        nodes: newNodes,
      }
    }

    case 'ADD_WALL': {
      const newWalls = new Map(newState.walls)
      newWalls.set(action.wall.id, action.wall)

      // Обновляем связанные узлы
      const newNodes = new Map(newState.nodes)
      const startNode = newNodes.get(action.wall.startNodeId)
      const endNode = newNodes.get(action.wall.endNodeId)

      if (startNode) {
        newNodes.set(action.wall.startNodeId, {
          ...startNode,
          connectedWalls: [...startNode.connectedWalls, action.wall.id],
        })
      }

      if (endNode) {
        newNodes.set(action.wall.endNodeId, {
          ...endNode,
          connectedWalls: [...endNode.connectedWalls, action.wall.id],
        })
      }

      return {
        ...newState,
        walls: newWalls,
        nodes: newNodes,
      }
    }

    case 'UPDATE_WALL': {
      const wall = newState.walls.get(action.id)
      if (!wall) return newState

      const newWalls = new Map(newState.walls)
      newWalls.set(action.id, { ...wall, ...action.updates })
      return {
        ...newState,
        walls: newWalls,
      }
    }

    case 'DELETE_WALL': {
      const wall = newState.walls.get(action.id)
      if (!wall) return newState

      const newWalls = new Map(newState.walls)
      newWalls.delete(action.id)

      // Обновляем связанные узлы
      const newNodes = new Map(newState.nodes)
      const startNode = newNodes.get(wall.startNodeId)
      const endNode = newNodes.get(wall.endNodeId)

      if (startNode) {
        newNodes.set(wall.startNodeId, {
          ...startNode,
          connectedWalls: startNode.connectedWalls.filter((id) => id !== action.id),
        })
      }

      if (endNode) {
        newNodes.set(wall.endNodeId, {
          ...endNode,
          connectedWalls: endNode.connectedWalls.filter((id) => id !== action.id),
        })
      }

      return {
        ...newState,
        walls: newWalls,
        nodes: newNodes,
      }
    }

    case 'ADD_DOOR': {
      const newDoors = new Map(newState.doors)
      newDoors.set(action.door.id, action.door)
      return {
        ...newState,
        doors: newDoors,
      }
    }

    case 'UPDATE_DOOR': {
      const door = newState.doors.get(action.id)
      if (!door) return newState

      const newDoors = new Map(newState.doors)
      newDoors.set(action.id, { ...door, ...action.updates })
      return {
        ...newState,
        doors: newDoors,
      }
    }

    case 'DELETE_DOOR': {
      const newDoors = new Map(newState.doors)
      newDoors.delete(action.id)
      return {
        ...newState,
        doors: newDoors,
      }
    }

    case 'ADD_WINDOW': {
      const newWindows = new Map(newState.windows)
      newWindows.set(action.window.id, action.window)
      return {
        ...newState,
        windows: newWindows,
      }
    }

    case 'UPDATE_WINDOW': {
      const window = newState.windows.get(action.id)
      if (!window) return newState

      const newWindows = new Map(newState.windows)
      newWindows.set(action.id, { ...window, ...action.updates })
      return {
        ...newState,
        windows: newWindows,
      }
    }

    case 'DELETE_WINDOW': {
      const newWindows = new Map(newState.windows)
      newWindows.delete(action.id)
      return {
        ...newState,
        windows: newWindows,
      }
    }

    case 'ADD_ROOM': {
      const newRooms = new Map(newState.rooms)
      newRooms.set(action.room.id, action.room)
      return {
        ...newState,
        rooms: newRooms,
      }
    }

    case 'UPDATE_ROOM': {
      const room = newState.rooms.get(action.id)
      if (!room) return newState

      const newRooms = new Map(newState.rooms)
      newRooms.set(action.id, { ...room, ...action.updates })
      return {
        ...newState,
        rooms: newRooms,
      }
    }

    case 'DELETE_ROOM': {
      const newRooms = new Map(newState.rooms)
      newRooms.delete(action.id)
      return {
        ...newState,
        rooms: newRooms,
      }
    }

    case 'ADD_FURNITURE': {
      const newFurniture = new Map(newState.furniture)
      newFurniture.set(action.furniture.id, action.furniture)
      return {
        ...newState,
        furniture: newFurniture,
      }
    }

    case 'UPDATE_FURNITURE': {
      const furniture = newState.furniture.get(action.id)
      if (!furniture) return newState

      const newFurniture = new Map(newState.furniture)
      newFurniture.set(action.id, { ...furniture, ...action.updates })
      return {
        ...newState,
        furniture: newFurniture,
      }
    }

    case 'DELETE_FURNITURE': {
      const newFurniture = new Map(newState.furniture)
      newFurniture.delete(action.id)
      return {
        ...newState,
        furniture: newFurniture,
      }
    }

    case 'ADD_DIMENSION': {
      const newDimensions = new Map(newState.dimensions)
      newDimensions.set(action.dimension.id, action.dimension)
      return {
        ...newState,
        dimensions: newDimensions,
      }
    }

    case 'UPDATE_DIMENSION': {
      const dimension = newState.dimensions.get(action.id)
      if (!dimension) return newState

      const newDimensions = new Map(newState.dimensions)
      newDimensions.set(action.id, { ...dimension, ...action.updates })
      return {
        ...newState,
        dimensions: newDimensions,
      }
    }

    case 'DELETE_DIMENSION': {
      const newDimensions = new Map(newState.dimensions)
      newDimensions.delete(action.id)
      return {
        ...newState,
        dimensions: newDimensions,
      }
    }

    case 'UPDATE_LAYER': {
      const layer = newState.layers.get(action.id)
      if (!layer) return newState

      const newLayers = new Map(newState.layers)
      newLayers.set(action.id, { ...layer, ...action.updates })
      return {
        ...newState,
        layers: newLayers,
      }
    }

    case 'SET_CAMERA':
      return {
        ...newState,
        camera: { ...newState.camera, ...action.camera },
      }

    case 'SET_BACKGROUND':
      return {
        ...newState,
        backgroundImage: action.background,
      }

    case 'START_WALL_DRAWING':
      return {
        ...newState,
        wallDrawingState: {
          isDrawing: true,
          nodes: [],
        },
      }

    case 'ADD_WALL_NODE':
      return {
        ...newState,
        wallDrawingState: {
          ...newState.wallDrawingState,
          nodes: [...newState.wallDrawingState.nodes, action.nodeId],
        },
      }

    case 'FINISH_WALL_DRAWING':
    case 'CANCEL_WALL_DRAWING':
      return {
        ...newState,
        wallDrawingState: {
          isDrawing: false,
          nodes: [],
        },
      }

    case 'START_DIMENSION_DRAWING':
      return {
        ...newState,
        dimensionDrawingState: {
          isDrawing: true,
          startPoint: action.startPoint,
          tempEndPoint: null,
        },
      }

    case 'UPDATE_DIMENSION_DRAWING':
      return {
        ...newState,
        dimensionDrawingState: {
          ...newState.dimensionDrawingState,
          tempEndPoint: action.endPoint,
        },
      }

    case 'FINISH_DIMENSION_DRAWING':
    case 'CANCEL_DIMENSION_DRAWING':
      return {
        ...newState,
        dimensionDrawingState: {
          isDrawing: false,
          startPoint: null,
          tempEndPoint: null,
        },
      }

    case 'START_ROOM_SELECTION':
      return {
        ...newState,
        roomSelectionState: {
          isSelecting: true,
          startPoint: action.startPoint,
          endPoint: action.startPoint,
        },
      }

    case 'UPDATE_ROOM_SELECTION':
      return {
        ...newState,
        roomSelectionState: {
          ...newState.roomSelectionState,
          endPoint: action.endPoint,
        },
      }

    case 'FINISH_ROOM_SELECTION':
    case 'CANCEL_ROOM_SELECTION':
      return {
        ...newState,
        roomSelectionState: {
          isSelecting: false,
          startPoint: null,
          endPoint: null,
        },
      }

    case 'START_DRAG': {
      // Сохраняем снапшот перед началом drag
      const snapshot = createSnapshot(newState)
      const { history, historyIndex } = addToHistory(
        newState.history,
        newState.historyIndex,
        snapshot
      )
      return {
        ...newState,
        isDragging: true,
        history,
        historyIndex,
      }
    }

    case 'END_DRAG': {
      // Если отмена - просто сбрасываем флаг, не сохраняем в историю
      if (action.cancel) {
        return {
          ...newState,
          isDragging: false,
        }
      }
      
      // Сохраняем финальный снапшот после завершения drag
      const snapshot = createSnapshot(newState)
      const { history, historyIndex } = addToHistory(
        newState.history,
        newState.historyIndex,
        snapshot
      )
      return {
        ...newState,
        isDragging: false,
        history,
        historyIndex,
      }
    }

    case 'UNDO': {
      if (!canUndo(state.historyIndex)) return state
      
      const snapshot = state.history[state.historyIndex - 1]
      if (!snapshot) return state
      
      const restoredState = restoreSnapshot(state, snapshot)
      return {
        ...restoredState,
        historyIndex: state.historyIndex - 1,
      }
    }

    case 'REDO': {
      if (!canRedo(state.historyIndex, state.history.length)) return state
      
      const snapshot = state.history[state.historyIndex + 1]
      if (!snapshot) return state
      
      const restoredState = restoreSnapshot(state, snapshot)
      return {
        ...restoredState,
        historyIndex: state.historyIndex + 1,
      }
    }

    case 'CLEAR_ALL':
      return {
        ...initialState,
        layers: state.layers,
        planSettings: state.planSettings,
        gridSettings: state.gridSettings,
        snapMode: state.snapMode,
        camera: state.camera,
      }

    default:
      return newState
  }
}

// Context
type EditorContextType = {
  state: EditorState
  dispatch: React.Dispatch<EditorAction>
  
  // Вспомогательные методы
  setTool: (tool: Tool) => void
  setSelection: (type: Selection['type'], id: string | null) => void
  addNode: (x: number, y: number) => string
  addWall: (startNodeId: string, endNodeId: string, type?: 'load-bearing' | 'partition') => string
  addDoor: (wallId: string, position?: number) => string
  addWindow: (wallId: string, position?: number) => string
  deleteSelected: () => void
  updateCamera: (updates: Partial<typeof DEFAULT_CAMERA>) => void
  zoom: (delta: number, center?: Point) => void
  pan: (dx: number, dy: number) => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
}

const EditorContext = createContext<EditorContextType | null>(null)

// Provider
export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(editorReducer, initialState)

  // Вспомогательные методы
  const setTool = useCallback((tool: Tool) => {
    dispatch({ type: 'SET_TOOL', tool })
  }, [])

  const setSelection = useCallback((type: Selection['type'], id: string | null) => {
    dispatch({ type: 'SET_SELECTION', selection: { type, id } })
  }, [])

  const addNode = useCallback((x: number, y: number): string => {
    const id = generateNodeId()
    const node: Node = {
      id,
      x,
      y,
      connectedWalls: [],
    }
    dispatch({ type: 'ADD_NODE', node })
    return id
  }, [])

  const addWall = useCallback((
    startNodeId: string,
    endNodeId: string,
    type: 'load-bearing' | 'partition' = 'partition'
  ): string => {
    const id = generateWallId()
    const wall: Wall = {
      id,
      startNodeId,
      endNodeId,
      type,
      thickness: DEFAULT_WALL_THICKNESS[type],
      layerId: 'layer-walls',
    }
    dispatch({ type: 'ADD_WALL', wall })
    return id
  }, [])

  const addDoor = useCallback((wallId: string, position: number = 0.5): string => {
    const id = generateDoorId()
    const door: Door = {
      id,
      wallId,
      position,
      width: DEFAULT_DOOR_SIZE.width,
      height: DEFAULT_DOOR_SIZE.height,
      openDirection: 'right',
      layerId: 'layer-openings',
    }
    dispatch({ type: 'ADD_DOOR', door })
    return id
  }, [])

  const addWindow = useCallback((wallId: string, position: number = 0.5): string => {
    const id = generateWindowId()
    const window: Window = {
      id,
      wallId,
      position,
      width: DEFAULT_WINDOW_SIZE.width,
      height: DEFAULT_WINDOW_SIZE.height,
      sillHeight: DEFAULT_WINDOW_SIZE.sillHeight,
      layerId: 'layer-openings',
    }
    dispatch({ type: 'ADD_WINDOW', window })
    return id
  }, [])

  const deleteSelected = useCallback(() => {
    if (!state.selection.id || !state.selection.type) return

    switch (state.selection.type) {
      case 'node':
        dispatch({ type: 'DELETE_NODE', id: state.selection.id })
        break
      case 'wall':
        dispatch({ type: 'DELETE_WALL', id: state.selection.id })
        break
      case 'door':
        dispatch({ type: 'DELETE_DOOR', id: state.selection.id })
        break
      case 'window':
        dispatch({ type: 'DELETE_WINDOW', id: state.selection.id })
        break
      case 'room':
        dispatch({ type: 'DELETE_ROOM', id: state.selection.id })
        break
      // TODO: Восстановить функционал инструмента мебель
      case 'dimension':
        dispatch({ type: 'DELETE_DIMENSION', id: state.selection.id })
        break
    }

    dispatch({ type: 'SET_SELECTION', selection: { type: null, id: null } })
  }, [state.selection])

  const updateCamera = useCallback((updates: Partial<typeof DEFAULT_CAMERA>) => {
    dispatch({ type: 'SET_CAMERA', camera: updates })
  }, [])

  const zoom = useCallback((delta: number, center?: Point) => {
    const newZoom = Math.max(10, Math.min(200, state.camera.zoom * (1 + delta)))
    
    // Если указан центр, зумируем относительно него
    if (center) {
      const worldBefore = {
        x: center.x / state.camera.zoom + state.camera.x,
        y: center.y / state.camera.zoom + state.camera.y,
      }
      
      const worldAfter = {
        x: center.x / newZoom + state.camera.x,
        y: center.y / newZoom + state.camera.y,
      }
      
      dispatch({
        type: 'SET_CAMERA',
        camera: {
          zoom: newZoom,
          x: state.camera.x + (worldBefore.x - worldAfter.x),
          y: state.camera.y + (worldBefore.y - worldAfter.y),
        },
      })
    } else {
      dispatch({ type: 'SET_CAMERA', camera: { zoom: newZoom } })
    }
  }, [state.camera])

  const pan = useCallback((dx: number, dy: number) => {
    dispatch({
      type: 'SET_CAMERA',
      camera: {
        x: state.camera.x + dx / state.camera.zoom,
        y: state.camera.y + dy / state.camera.zoom,
      },
    })
  }, [state.camera])

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' })
  }, [])

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' })
  }, [])

  const canUndoCheck = useCallback(() => {
    return canUndo(state.historyIndex)
  }, [state.historyIndex])

  const canRedoCheck = useCallback(() => {
    return canRedo(state.historyIndex, state.history.length)
  }, [state.historyIndex, state.history.length])

  const contextValue: EditorContextType = {
    state,
    dispatch,
    setTool,
    setSelection,
    addNode,
    addWall,
    addDoor,
    addWindow,
    deleteSelected,
    updateCamera,
    zoom,
    pan,
    undo,
    redo,
    canUndo: canUndoCheck,
    canRedo: canRedoCheck,
  }

  return (
    <EditorContext.Provider value={contextValue}>
      {children}
    </EditorContext.Provider>
  )
}

// Hook
export function useEditor() {
  const context = useContext(EditorContext)
  if (!context) {
    throw new Error('useEditor must be used within EditorProvider')
  }
  return context
}

