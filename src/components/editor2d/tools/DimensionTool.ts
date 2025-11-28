// Инструмент для рисования размерных линий

import type { Point, EditorState } from '@/types/editor'
import { generateDimensionId } from '@/lib/editor/utils'
import { distance } from '@/lib/editor/geometry'

const DEFAULT_OFFSET = 0.5 // 0.5 метра от линии

export class DimensionTool {
  /**
   * Обработка клика для начала/продолжения рисования размерной линии
   */
  static handleClick(
    position: Point,
    state: EditorState,
    dispatch: any
  ): boolean {
    const { dimensionDrawingState } = state

    // Если еще не начали рисовать - начинаем
    if (!dimensionDrawingState.isDrawing || !dimensionDrawingState.startPoint) {
      dispatch({
        type: 'START_DIMENSION_DRAWING',
        startPoint: position,
      })
      return true
    }

    // Если уже рисуем - завершаем
    const startPoint = dimensionDrawingState.startPoint
    
    // Находим слой для размеров
    const dimensionLayer = Array.from(state.layers.values()).find(
      (layer) => layer.id === 'layer-dimensions'
    ) || state.layers.get('layer-dimensions') || {
      id: 'layer-dimensions',
      name: 'Размеры',
      visible: true,
      locked: false,
      color: '#6366f1',
    }

    const dimensionId = generateDimensionId()
    
    // Вычисляем смещение перпендикулярно линии
    const dx = position.x - startPoint.x
    const dy = position.y - startPoint.y
    const length = Math.sqrt(dx * dx + dy * dy)
    
    // Если линия слишком короткая - отменяем
    if (length < 0.1) {
      dispatch({ type: 'CANCEL_DIMENSION_DRAWING' })
      return false
    }

    dispatch({
      type: 'ADD_DIMENSION',
      dimension: {
        id: dimensionId,
        startPoint,
        endPoint: position,
        offset: DEFAULT_OFFSET,
        layerId: dimensionLayer.id,
      },
    })

    // Завершаем рисование
    dispatch({ type: 'FINISH_DIMENSION_DRAWING' })

    // Выделяем добавленную размерную линию
    dispatch({
      type: 'SET_SELECTION',
      selection: { type: 'dimension', id: dimensionId },
    })

    return true
  }

  /**
   * Отмена рисования размерной линии
   */
  static cancelDrawing(dispatch: any) {
    dispatch({ type: 'CANCEL_DIMENSION_DRAWING' })
  }
}

