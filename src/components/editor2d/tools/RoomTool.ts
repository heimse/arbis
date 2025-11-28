// Инструмент для добавления комнат (новая версия - привязана к стенам)

import type { Point } from '@/types/plan';

/**
 * RoomTool для editor2dStore
 * Обработка кликов для создания комнат из замкнутых областей стен
 */
export class RoomTool {
  /**
   * Обработка клика для добавления комнаты
   * Вызывается из компонента, который использует editor2dStore
   */
  static handleClick(
    position: Point,
    addRoom: (position: Point) => void
  ): boolean {
    try {
      addRoom(position);
      return true;
    } catch (error) {
      console.error('Ошибка при создании комнаты:', error);
      return false;
    }
  }
}

