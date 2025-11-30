/**
 * Инструмент для добавления мебели (новая версия для editor2dStore)
 */

import type { Point } from '@/types/plan';
import type { Editor2DState } from '@/store/editor2dStore';
import { findRoomContainingPoint } from '@/lib/editor/furniture';
import { snapToGrid } from '@/lib/editor/geometry';

/**
 * Состояние инструмента мебели
 */
export type FurnitureToolState = {
  selectedCatalogItemId: string | null;
  ghostPosition: Point | null; // позиция призрака мебели
};

export class FurnitureTool2D {
  /**
   * Обработка перемещения мыши для показа призрака мебели
   */
  static handleMouseMove(
    position: Point,
    state: Editor2DState,
    toolState: FurnitureToolState
  ): Point {
    if (!toolState.selectedCatalogItemId) return position;

    // Применяем snap к сетке, если включен
    const snapSettings = state.plan.snapSettings;
    if (snapSettings.enabled && snapSettings.snapToGrid) {
      const gridSpacing = 0.5; // 0.5 метра = сетка 50 см
      return snapToGrid(position, gridSpacing);
    }

    return position;
  }

  /**
   * Обработка клика для размещения мебели
   */
  static handleClick(
    position: Point,
    state: Editor2DState,
    toolState: FurnitureToolState
  ): boolean {
    if (!toolState.selectedCatalogItemId) {
      // Если не выбран элемент каталога, просто возвращаем false
      return false;
    }

    // Применяем snap к позиции
    const snappedPosition = this.handleMouseMove(position, state, toolState);

    // Находим комнату, содержащую точку
    const containingRoom = findRoomContainingPoint(
      snappedPosition,
      state.plan.rooms
    );

    // Добавляем экземпляр мебели через store
    if (state.addFurnitureInstance) {
      state.addFurnitureInstance(
        toolState.selectedCatalogItemId,
        snappedPosition,
        containingRoom?.id
      );
      return true;
    }

    return false;
  }

  /**
   * Получить позицию призрака мебели
   */
  static getGhostPosition(
    mousePosition: Point,
    state: Editor2DState,
    toolState: FurnitureToolState
  ): Point | null {
    if (!toolState.selectedCatalogItemId) return null;
    return this.handleMouseMove(mousePosition, state, toolState);
  }
}



