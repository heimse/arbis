/**
 * Утилиты для привязки (snap) в редакторе
 */

import React from 'react';
import type { Point, WallNode, Wall, SnapSettings } from '@/types/plan';
import { distance, snapToGrid, closestPointOnSegment } from './geometry';

/**
 * Результат поиска точки привязки
 */
export type SnapResult = {
  point: Point;
  type: 'grid' | 'node' | 'midpoint' | 'perpendicular' | 'extension';
};

/**
 * Находит ближайшую точку привязки для указанной позиции
 */
export function findSnapPoint(
  worldPos: Point,
  snapSettings: SnapSettings,
  nodes: WallNode[],
  walls: Wall[],
  gridStep: number
): SnapResult | null {
  if (!snapSettings.enabled) {
    return null;
  }

  const snapDistance = snapSettings.snapDistance / gridStep; // Конвертируем пиксели в мировые координаты
  let closestSnap: SnapResult | null = null;
  let closestDistance = snapDistance;

  // Привязка к сетке
  if (snapSettings.snapToGrid) {
    const gridPoint = snapToGrid(worldPos, gridStep);
    const dist = distance(worldPos, gridPoint);
    if (dist < closestDistance) {
      closestDistance = dist;
      closestSnap = { point: gridPoint, type: 'grid' };
    }
  }

  // Привязка к узлам
  if (snapSettings.snapToNodes) {
    for (const node of nodes) {
      const dist = distance(worldPos, node.position);
      if (dist < closestDistance) {
        closestDistance = dist;
        closestSnap = { point: node.position, type: 'node' };
      }
    }
  }

  // Привязка к серединам стен
  if (snapSettings.snapToMidpoints) {
    for (const wall of walls) {
      const startNode = nodes.find((n) => n.id === wall.startNodeId);
      const endNode = nodes.find((n) => n.id === wall.endNodeId);
      
      if (startNode && endNode) {
        const midpoint: Point = {
          x: (startNode.position.x + endNode.position.x) / 2,
          y: (startNode.position.y + endNode.position.y) / 2,
        };
        const dist = distance(worldPos, midpoint);
        if (dist < closestDistance) {
          closestDistance = dist;
          closestSnap = { point: midpoint, type: 'midpoint' };
        }
      }
    }
  }

  // Привязка к перпендикуляру
  if (snapSettings.snapToPerpendicular) {
    for (const wall of walls) {
      const startNode = nodes.find((n) => n.id === wall.startNodeId);
      const endNode = nodes.find((n) => n.id === wall.endNodeId);
      
      if (startNode && endNode) {
        const closest = closestPointOnSegment(worldPos, startNode.position, endNode.position);
        const dist = distance(worldPos, closest.point);
        
        if (dist < closestDistance) {
          // Проверяем, что точка близка к перпендикуляру
          const wallDx = endNode.position.x - startNode.position.x;
          const wallDy = endNode.position.y - startNode.position.y;
          const toPointDx = worldPos.x - closest.point.x;
          const toPointDy = worldPos.y - closest.point.y;
          
          // Скалярное произведение должно быть близко к нулю для перпендикуляра
          const dot = wallDx * toPointDx + wallDy * toPointDy;
          const wallLength = Math.sqrt(wallDx * wallDx + wallDy * wallDy);
          const toPointLength = Math.sqrt(toPointDx * toPointDx + toPointDy * toPointDy);
          
          if (wallLength > 0 && toPointLength > 0) {
            const cosAngle = Math.abs(dot / (wallLength * toPointLength));
            // Если угол близок к 90° (cos ≈ 0)
            if (cosAngle < 0.1) {
              closestDistance = dist;
              closestSnap = { point: closest.point, type: 'perpendicular' };
            }
          }
        }
      }
    }
  }

  // Привязка к продолжению линий (extension)
  if (snapSettings.snapToExtension) {
    for (const wall of walls) {
      const startNode = nodes.find((n) => n.id === wall.startNodeId);
      const endNode = nodes.find((n) => n.id === wall.endNodeId);
      
      if (startNode && endNode) {
        // Продолжаем линию стены в обе стороны
        const dx = endNode.position.x - startNode.position.x;
        const dy = endNode.position.y - startNode.position.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length > 0) {
          const normalizedDx = dx / length;
          const normalizedDy = dy / length;
          
          // Продолжение от начала стены
          const extensionStart: Point = {
            x: startNode.position.x - normalizedDx * 1000, // Продолжаем на 1000 единиц
            y: startNode.position.y - normalizedDy * 1000,
          };
          
          // Продолжение от конца стены
          const extensionEnd: Point = {
            x: endNode.position.x + normalizedDx * 1000,
            y: endNode.position.y + normalizedDy * 1000,
          };
          
          const closest = closestPointOnSegment(worldPos, extensionStart, extensionEnd);
          const dist = distance(worldPos, closest.point);
          
          if (dist < closestDistance) {
            closestDistance = dist;
            closestSnap = { point: closest.point, type: 'extension' };
          }
        }
      }
    }
  }

  return closestSnap;
}

/**
 * Привязка к ортогональному направлению (0°, 90°, 180°, 270°)
 * Реэкспортируется из geometry.ts
 */
export { snapToOrthogonal } from './geometry';

/**
 * Рендерит индикатор привязки для SVG (используется в pro версии)
 */
export function renderSnapIndicator(
  snap: SnapResult,
  zoom: number
): React.ReactElement {
  const size = 12 / zoom;
  
  return (
    <g>
      {/* Крестик */}
      <line
        x1={snap.point.x - size}
        y1={snap.point.y}
        x2={snap.point.x + size}
        y2={snap.point.y}
        stroke="#4caf50"
        strokeWidth={2 / zoom}
      />
      <line
        x1={snap.point.x}
        y1={snap.point.y - size}
        x2={snap.point.x}
        y2={snap.point.y + size}
        stroke="#4caf50"
        strokeWidth={2 / zoom}
      />
      {/* Круг */}
      <circle
        cx={snap.point.x}
        cy={snap.point.y}
        r={size}
        fill="none"
        stroke="#4caf50"
        strokeWidth={2 / zoom}
      />
    </g>
  );
}

