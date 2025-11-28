/**
 * Canvas Renderer для editor2dStore
 * Рендерит элементы плана с новыми типами данных
 */

import type { Point, Room, Wall, WallNode, Layer } from '@/types/plan';
import type { Camera } from '@/types/editor';
import { worldToScreen } from '@/lib/editor/geometry';
import { getPolygonCentroid } from '@/lib/editor/rooms';

type Selection = {
  id: string | null;
  type: 'room' | 'wall' | 'node' | 'door' | 'window' | null;
};

export class CanvasRenderer2D {
  private ctx: CanvasRenderingContext2D;
  private camera: Camera;
  private width: number;
  private height: number;
  private isDark: boolean;

  constructor(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    width: number,
    height: number
  ) {
    this.ctx = ctx;
    this.camera = camera;
    this.width = width;
    this.height = height;
    this.isDark = document.documentElement.classList.contains('dark');
  }

  /**
   * Рендерит комнаты (новая версия - с полигонами)
   */
  renderRooms(
    rooms: Room[],
    layers: Layer[],
    selection: Selection,
    isDragging: boolean = false
  ) {
    const ctx = this.ctx;

    for (const room of rooms) {
      const layer = layers.find((l) => l.id === room.layerId);
      if (!layer || !layer.visible) continue;

      const isSelected = selection.type === 'room' && selection.id === room.id;

      // Полупрозрачность если перетаскиваем
      if (isSelected && isDragging) {
        ctx.globalAlpha = 0.7;
      } else {
        ctx.globalAlpha = layer.opacity || 0.4;
      }

      // Цвет заливки - из материала пола или слоя
      const fillColor = room.floorMaterial?.color || layer.color || '#3b82f6';
      ctx.fillStyle = fillColor;

      // Контур
      ctx.strokeStyle = isSelected
        ? '#1d4ed8'
        : this.isDark
        ? '#3b82f6'
        : '#0ea5e9';
      ctx.lineWidth = isSelected ? 3 : 1;

      // Рисуем полигон
      if (room.polygon.length > 0) {
        ctx.beginPath();
        const firstPoint = worldToScreen(room.polygon[0], this.camera);
        ctx.moveTo(firstPoint.x, firstPoint.y);

        for (let i = 1; i < room.polygon.length; i++) {
          const point = worldToScreen(room.polygon[i], this.camera);
          ctx.lineTo(point.x, point.y);
        }

        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Подпись комнаты (название и площадь)
      const centroid = getPolygonCentroid(room.polygon);
      const screenCentroid = worldToScreen(centroid, this.camera);

      // Проверяем, достаточно ли места для подписи
      // (грубая оценка - проверяем размер полигона)
      let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;
      for (const point of room.polygon) {
        const screen = worldToScreen(point, this.camera);
        minX = Math.min(minX, screen.x);
        maxX = Math.max(maxX, screen.x);
        minY = Math.min(minY, screen.y);
        maxY = Math.max(maxY, screen.y);
      }

      const roomWidth = maxX - minX;
      const roomHeight = maxY - minY;

      if (roomWidth > 80 && roomHeight > 40) {
        // Фон для текста
        ctx.fillStyle = this.isDark
          ? 'rgba(0, 0, 0, 0.7)'
          : 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const nameText = room.name;
        const areaText = `${room.area.toFixed(2)} м²`;

        const nameMetrics = ctx.measureText(nameText);
        const areaMetrics = ctx.measureText(areaText);
        const textWidth = Math.max(nameMetrics.width, areaMetrics.width);
        const textHeight = 30;
        const padding = 6;

        ctx.fillRect(
          screenCentroid.x - textWidth / 2 - padding,
          screenCentroid.y - textHeight / 2 - padding,
          textWidth + padding * 2,
          textHeight + padding * 2
        );

        // Текст
        ctx.fillStyle = this.isDark ? '#ffffff' : '#1f2937';
        ctx.fillText(nameText, screenCentroid.x, screenCentroid.y - 8);
        ctx.font = '11px sans-serif';
        ctx.fillText(areaText, screenCentroid.x, screenCentroid.y + 8);
      }

      ctx.globalAlpha = 1;
    }
  }

  /**
   * Рендерит стены
   */
  renderWalls(
    walls: Wall[],
    nodes: WallNode[],
    layers: Layer[],
    selection: Selection,
    isDragging: boolean = false
  ) {
    const ctx = this.ctx;

    for (const wall of walls) {
      const layer = layers.find((l) => l.id === wall.layerId);
      if (!layer || !layer.visible) continue;

      const startNode = nodes.find((n) => n.id === wall.startNodeId);
      const endNode = nodes.find((n) => n.id === wall.endNodeId);

      if (!startNode || !endNode) continue;

      const isSelected = selection.type === 'wall' && selection.id === wall.id;

      if (isSelected && isDragging) {
        ctx.globalAlpha = 0.7;
      } else {
        ctx.globalAlpha = layer.opacity || 1;
      }

      const start = worldToScreen(startNode.position, this.camera);
      const end = worldToScreen(endNode.position, this.camera);

      // Рисуем стену как линию
      ctx.strokeStyle = isSelected
        ? '#1d4ed8'
        : layer.color || (this.isDark ? '#ffffff' : '#000000');
      ctx.lineWidth = isSelected ? 3 : Math.max(1, wall.thickness / 10);

      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      ctx.globalAlpha = 1;
    }
  }

  /**
   * Рендерит узлы
   */
  renderNodes(
    nodes: WallNode[],
    selection: Selection,
    isDragging: boolean = false
  ) {
    const ctx = this.ctx;

    for (const node of nodes) {
      const isSelected =
        selection.type === 'node' && selection.id === node.id;

      if (isSelected && isDragging) {
        ctx.globalAlpha = 0.7;
      }

      const screenPos = worldToScreen(node.position, this.camera);

      ctx.fillStyle = isSelected ? '#1d4ed8' : (this.isDark ? '#ffffff' : '#000000');
      ctx.strokeStyle = isSelected ? '#3b82f6' : (this.isDark ? '#9ca3af' : '#6b7280');
      ctx.lineWidth = isSelected ? 2 : 1;

      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, isSelected ? 6 : 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.globalAlpha = 1;
    }
  }
}

