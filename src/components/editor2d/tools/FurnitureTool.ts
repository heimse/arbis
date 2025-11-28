// Инструмент для добавления мебели

import type { Point, EditorState } from '@/types/editor'
import { defaultFurnitureCatalog, findCatalogItem } from '@/lib/editor/furnitureCatalog'
import { generateFurnitureId } from '@/lib/editor/utils'

// Состояние для размещения мебели
let selectedCatalogItemId: string | null = null
let previewPosition: Point | null = null

export class FurnitureTool {
  /**
   * Устанавливает выбранный элемент каталога для размещения
   */
  static setSelectedCatalogItem(catalogItemId: string | null) {
    selectedCatalogItemId = catalogItemId
    previewPosition = null
  }

  /**
   * Получает выбранный элемент каталога
   */
  static getSelectedCatalogItem(): string | null {
    return selectedCatalogItemId
  }

  /**
   * Обновляет позицию превью мебели
   */
  static updatePreviewPosition(position: Point) {
    previewPosition = position
  }

  /**
   * Получает позицию превью
   */
  static getPreviewPosition(): Point | null {
    return previewPosition
  }

  /**
   * Обработка клика для добавления мебели
   */
  static handleClick(
    position: Point,
    state: EditorState,
    dispatch: any
  ): boolean {
    if (!selectedCatalogItemId) {
      // Если элемент каталога не выбран, ничего не делаем
      return false
    }

    const catalogItem = findCatalogItem(selectedCatalogItemId)
    if (!catalogItem) {
      console.warn(`Элемент каталога не найден: ${selectedCatalogItemId}`)
      return false
    }

    // Находим слой для мебели
    const furnitureLayer = Array.from(state.layers.values()).find(
      (l) => l.name === 'Мебель' || l.id === 'layer-furniture'
    )
    const layerId = furnitureLayer?.id || 'layer-furniture'

    // Конвертируем размеры из мм в метры
    const pixelsPerMeter = 80 // TODO: получать из настроек плана
    const widthMeters = catalogItem.defaultSize.width / 1000
    const depthMeters = catalogItem.defaultSize.depth / 1000

    // Создаём мебель
    const furnitureId = generateFurnitureId()
    dispatch({
      type: 'ADD_FURNITURE',
      furniture: {
        id: furnitureId,
        type: catalogItem.name,
        position: {
          x: position.x - widthMeters / 2,
          y: position.y - depthMeters / 2,
        },
        size: {
          width: widthMeters,
          height: depthMeters,
        },
        rotation: 0,
        layerId,
      },
    })

    // Выделяем добавленную мебель
    dispatch({
      type: 'SET_SELECTION',
      selection: { type: 'furniture', id: furnitureId },
    })

    return true
  }

  /**
   * Получает превью мебели для отрисовки
   */
  static getPreview(): { catalogItemId: string; position: Point } | null {
    if (!selectedCatalogItemId || !previewPosition) {
      return null
    }
    return {
      catalogItemId: selectedCatalogItemId,
      position: previewPosition,
    }
  }
}
