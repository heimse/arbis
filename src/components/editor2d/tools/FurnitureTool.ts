// Инструмент для добавления мебели

import type { Point, EditorState } from '@/types/editor'
import { generateFurnitureId } from '@/lib/editor/utils'

const DEFAULT_FURNITURE_SIZE = {
  width: 1, // 1 метр
  height: 0.5, // 0.5 метра
}

export class FurnitureTool {
  /**
   * Обработка клика для добавления мебели
   */
  static handleClick(
    position: Point,
    state: EditorState,
    dispatch: any
  ): boolean {
    const furnitureId = generateFurnitureId()
    
    // Находим слой для мебели
    const furnitureLayer = Array.from(state.layers.values()).find(
      (layer) => layer.id === 'layer-furniture'
    ) || state.layers.get('layer-furniture') || {
      id: 'layer-furniture',
      name: 'Мебель',
      visible: true,
      locked: false,
      color: '#10b981',
    }

    dispatch({
      type: 'ADD_FURNITURE',
      furniture: {
        id: furnitureId,
        type: 'generic',
        position: {
          x: position.x - DEFAULT_FURNITURE_SIZE.width / 2,
          y: position.y - DEFAULT_FURNITURE_SIZE.height / 2,
        },
        size: DEFAULT_FURNITURE_SIZE,
        rotation: 0,
        layerId: furnitureLayer.id,
      },
    })

    // Выделяем добавленную мебель
    dispatch({
      type: 'SET_SELECTION',
      selection: { type: 'furniture', id: furnitureId },
    })

    return true
  }
}

