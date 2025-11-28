"use client";

import * as React from "react";
import { useEditor2DStore } from "@/store/editor2dStore";
import type { Point, Wall, WallNode } from "@/types/plan";
import { getWallPolygon, getWallLength } from "@/lib/editor/walls";
import { findSnapPoint, snapToOrthogonal } from "@/lib/editor/snap";
import { distance, formatDimension, pixelsToMm } from "@/lib/editor/geometry";

/**
 * Профессиональный Canvas-based 2D редактор с GPU ускорением
 * Использует HTML5 Canvas API для максимальной производительности
 */
export function Editor2DCanvas() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = React.useState({ width: 800, height: 600 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [draggedId, setDraggedId] = React.useState<string | null>(null);
  const [draggedType, setDraggedType] = React.useState<"node" | "room" | "furniture" | null>(null);
  const [dragStart, setDragStart] = React.useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = React.useState(false);
  const [panStart, setPanStart] = React.useState<Point>({ x: 0, y: 0 });
  const [mouseWorldPos, setMouseWorldPos] = React.useState<Point>({ x: 0, y: 0 });
  const [hoveredNodeId, setHoveredNodeId] = React.useState<string | null>(null);
  const animationFrameRef = React.useRef<number | null>(null);

  const {
    plan,
    selectedId,
    selectedType,
    tool,
    zoom,
    offset,
    wallDrawing,
    snapPoint,
    select,
    clearSelection,
    updateRoom,
    updateFurniture,
    setOffset,
    setZoom,
    startWallDrawing,
    continueWallDrawing,
    finishWallDrawing,
    addRoom,
    addFurniture,
    moveNode,
    setSnapPoint,
  } = useEditor2DStore();

  // Получаем реальные размеры
  const realWorldSize = plan.realWorldSize || {
    widthMeters: 12.5,
    heightMeters: 12,
    pixelsPerMeter: 80,
  };
  const backgroundImage = plan.backgroundImage;

  // Обработка изменения размеров
  React.useEffect(() => {
    const updateSize = () => {
      if (canvasRef.current) {
        const parent = canvasRef.current.parentElement;
        if (parent) {
          const width = parent.offsetWidth;
          const height = parent.offsetHeight;
          setDimensions({ width, height });

          // Устанавливаем физический размер canvas для Retina/HiDPI
          const dpr = window.devicePixelRatio || 1;
          canvasRef.current.width = width * dpr;
          canvasRef.current.height = height * dpr;
          canvasRef.current.style.width = `${width}px`;
          canvasRef.current.style.height = `${height}px`;

          const ctx = canvasRef.current.getContext("2d", {
            alpha: false,
            desynchronized: true, // GPU ускорение
          });
          if (ctx) {
            ctx.scale(dpr, dpr);
          }
        }
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Преобразование координат
  const screenToWorld = (screenX: number, screenY: number): Point => {
    return {
      x: (screenX - offset.x) / zoom,
      y: (screenY - offset.y) / zoom,
    };
  };

  const worldToScreen = (worldX: number, worldY: number): Point => {
    return {
      x: worldX * zoom + offset.x,
      y: worldY * zoom + offset.y,
    };
  };

  // Получить координаты мыши
  const getMousePosition = (e: React.MouseEvent): Point => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return { x, y };
  };

  // Рендеринг через Canvas
  const render = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", {
      alpha: false,
      desynchronized: true,
    });
    if (!ctx) return;

    // Очистка canvas
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    // Сохраняем контекст для трансформаций
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(zoom, zoom);

    // 1. Рендер фонового изображения
    if (backgroundImage && backgroundImage.visible) {
      renderBackgroundImage(ctx);
    }

    // 2. Рендер сетки
    renderGrid(ctx);

    // 3. Рендер стен
    renderWalls(ctx);

    // 4. Рендер дверей и окон
    renderDoors(ctx);
    renderWindows(ctx);

    // 5. Рендер комнат (легаси)
    renderRooms(ctx);

    // 6. Рендер мебели (легаси)
    renderFurniture(ctx);

    // 7. Рендер узлов
    renderNodes(ctx);

    // 8. Рендер временной линии при рисовании стены
    if (wallDrawing.active && wallDrawing.startNodeId) {
      renderTempWall(ctx);
    }

    // 9. Рендер snap индикатора
    if (snapPoint) {
      renderSnapIndicator(ctx, snapPoint);
    }

    // Восстанавливаем контекст
    ctx.restore();

    // 10. Рендер UI элементов (в экранных координатах)
    renderUIOverlay(ctx);
  }, [
    dimensions,
    offset,
    zoom,
    plan,
    selectedId,
    selectedType,
    wallDrawing,
    snapPoint,
    backgroundImage,
    realWorldSize,
    hoveredNodeId,
    mouseWorldPos,
  ]);

  // Автоматический рендеринг при изменениях
  React.useEffect(() => {
    render();
  }, [render]);

  // === РЕНДЕР ФУНКЦИИ ===

  const renderBackgroundImage = (ctx: CanvasRenderingContext2D) => {
    if (!backgroundImage) return;
    // TODO: Загрузка и рендер изображения
    // Реализовать через Image() объект
  };

  const renderGrid = (ctx: CanvasRenderingContext2D) => {
    const gridStep = realWorldSize.pixelsPerMeter / 2;

    const startX = Math.floor((-offset.x / zoom) / gridStep) * gridStep;
    const endX = Math.ceil((dimensions.width - offset.x) / zoom / gridStep) * gridStep;
    const startY = Math.floor((-offset.y / zoom) / gridStep) * gridStep;
    const endY = Math.ceil((dimensions.height - offset.y) / zoom / gridStep) * gridStep;

    ctx.lineWidth = 1 / zoom;

    // Вертикальные линии
    for (let x = startX; x <= endX; x += gridStep) {
      const isMainLine = Math.abs(x % realWorldSize.pixelsPerMeter) < 0.1;
      ctx.strokeStyle = isMainLine ? "#d0d0d0" : "#e8e8e8";
      ctx.lineWidth = isMainLine ? 1.5 / zoom : 1 / zoom;

      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }

    // Горизонтальные линии
    for (let y = startY; y <= endY; y += gridStep) {
      const isMainLine = Math.abs(y % realWorldSize.pixelsPerMeter) < 0.1;
      ctx.strokeStyle = isMainLine ? "#d0d0d0" : "#e8e8e8";
      ctx.lineWidth = isMainLine ? 1.5 / zoom : 1 / zoom;

      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }
  };

  const renderWalls = (ctx: CanvasRenderingContext2D) => {
    const visibleLayers = new Set(plan.layers.filter((l) => l.visible).map((l) => l.id));

    ctx.lineJoin = "miter";
    ctx.lineCap = "butt";

    plan.walls.forEach((wall) => {
      if (!visibleLayers.has(wall.layerId)) return;

      const layer = plan.layers.find((l) => l.id === wall.layerId);
      const polygon = getWallPolygon(wall, plan.nodes);
      if (polygon.length === 0) return;

      const isSelected = selectedType === "wall" && selectedId === wall.id;

      // Цвет в зависимости от типа стены
      let fillColor = "#34495e";
      if (wall.type === "exterior") fillColor = "#2c3e50";
      else if (wall.type === "partition") fillColor = "#7f8c8d";

      // Рисуем полигон стены
      ctx.fillStyle = fillColor;
      ctx.strokeStyle = isSelected ? "#1976d2" : "#000000";
      ctx.lineWidth = isSelected ? 3 / zoom : 1 / zoom;
      ctx.globalAlpha = layer?.opacity || 1;

      ctx.beginPath();
      ctx.moveTo(polygon[0].x, polygon[0].y);
      for (let i = 1; i < polygon.length; i++) {
        ctx.lineTo(polygon[i].x, polygon[i].y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.globalAlpha = 1;

      // Рендер размера стены
      renderWallDimension(ctx, wall);
    });
  };

  const renderWallDimension = (ctx: CanvasRenderingContext2D, wall: Wall) => {
    const startNode = plan.nodes.find((n) => n.id === wall.startNodeId);
    const endNode = plan.nodes.find((n) => n.id === wall.endNodeId);
    if (!startNode || !endNode) return;

    const midX = (startNode.position.x + endNode.position.x) / 2;
    const midY = (startNode.position.y + endNode.position.y) / 2;

    const lengthPx = distance(startNode.position, endNode.position);
    const lengthMm = pixelsToMm(lengthPx, realWorldSize.pixelsPerMeter);
    const text = formatDimension(lengthMm, plan.measurementUnit);

    ctx.save();
    ctx.font = `${12 / zoom}px sans-serif`;
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Фон для текста
    const metrics = ctx.measureText(text);
    const padding = 4 / zoom;
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fillRect(
      midX - metrics.width / 2 - padding,
      midY - 6 / zoom - padding,
      metrics.width + padding * 2,
      12 / zoom + padding * 2
    );

    // Текст
    ctx.fillStyle = "#000000";
    ctx.fillText(text, midX, midY);
    ctx.restore();
  };

  const renderDoors = (ctx: CanvasRenderingContext2D) => {
    // TODO: Реализовать рендер дверей
    plan.doors.forEach((door) => {
      const wall = plan.walls.find((w) => w.id === door.wallId);
      if (!wall) return;

      const startNode = plan.nodes.find((n) => n.id === wall.startNodeId);
      const endNode = plan.nodes.find((n) => n.id === wall.endNodeId);
      if (!startNode || !endNode) return;

      // Вычислить позицию двери на стене
      const doorX = startNode.position.x + (endNode.position.x - startNode.position.x) * door.position;
      const doorY = startNode.position.y + (endNode.position.y - startNode.position.y) * door.position;

      // Нарисовать проём
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#1976d2";
      ctx.lineWidth = 2 / zoom;
      const doorWidth = door.width / 10; // конвертация из мм

      ctx.fillRect(doorX - doorWidth / 2, doorY - 5, doorWidth, 10);
      ctx.strokeRect(doorX - doorWidth / 2, doorY - 5, doorWidth, 10);
    });
  };

  const renderWindows = (ctx: CanvasRenderingContext2D) => {
    // TODO: Реализовать рендер окон
    plan.windows.forEach((window) => {
      const wall = plan.walls.find((w) => w.id === window.wallId);
      if (!wall) return;

      const startNode = plan.nodes.find((n) => n.id === wall.startNodeId);
      const endNode = plan.nodes.find((n) => n.id === wall.endNodeId);
      if (!startNode || !endNode) return;

      // Вычислить позицию окна на стене
      const winX = startNode.position.x + (endNode.position.x - startNode.position.x) * window.position;
      const winY = startNode.position.y + (endNode.position.y - startNode.position.y) * window.position;

      // Нарисовать окно
      ctx.fillStyle = "#e3f2fd";
      ctx.strokeStyle = "#2196f3";
      ctx.lineWidth = 2 / zoom;
      const winWidth = window.width / 10;

      ctx.fillRect(winX - winWidth / 2, winY - 5, winWidth, 10);
      ctx.strokeRect(winX - winWidth / 2, winY - 5, winWidth, 10);
    });
  };

  const renderNodes = (ctx: CanvasRenderingContext2D) => {
    const radius = 6 / zoom;

    plan.nodes.forEach((node) => {
      const isSelected = selectedType === "node" && selectedId === node.id;
      const isHovered = hoveredNodeId === node.id;

      ctx.fillStyle = isSelected ? "#1976d2" : "#ffffff";
      ctx.strokeStyle = isSelected ? "#1976d2" : isHovered ? "#1976d2" : "#000000";
      ctx.lineWidth = 2 / zoom;

      ctx.beginPath();
      ctx.arc(node.position.x, node.position.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  };

  const renderTempWall = (ctx: CanvasRenderingContext2D) => {
    const startNode = plan.nodes.find((n) => n.id === wallDrawing.startNodeId);
    if (!startNode) return;

    const endPoint = snapPoint || mouseWorldPos;

    ctx.strokeStyle = "#1976d2";
    ctx.lineWidth = 2 / zoom;
    ctx.setLineDash([10 / zoom, 5 / zoom]);

    ctx.beginPath();
    ctx.moveTo(startNode.position.x, startNode.position.y);
    ctx.lineTo(endPoint.x, endPoint.y);
    ctx.stroke();

    ctx.setLineDash([]);
  };

  const renderSnapIndicator = (ctx: CanvasRenderingContext2D, point: Point) => {
    const size = 12 / zoom;

    ctx.strokeStyle = "#4caf50";
    ctx.lineWidth = 2 / zoom;

    // Крестик
    ctx.beginPath();
    ctx.moveTo(point.x - size, point.y);
    ctx.lineTo(point.x + size, point.y);
    ctx.moveTo(point.x, point.y - size);
    ctx.lineTo(point.x, point.y + size);
    ctx.stroke();

    // Круг
    ctx.beginPath();
    ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
    ctx.stroke();
  };

  const renderRooms = (ctx: CanvasRenderingContext2D) => {
    plan.rooms.forEach((room) => {
      const isSelected = selectedType === "room" && selectedId === room.id;

      ctx.fillStyle = "#e3f2fd";
      ctx.strokeStyle = isSelected ? "#1976d2" : "#90caf9";
      ctx.lineWidth = isSelected ? 3 / zoom : 2 / zoom;

      ctx.fillRect(room.position.x, room.position.y, room.size.width, room.size.height);
      ctx.strokeRect(room.position.x, room.position.y, room.size.width, room.size.height);

      // Текст
      ctx.save();
      ctx.font = `${16 / zoom}px sans-serif`;
      ctx.fillStyle = "#1976d2";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        room.name,
        room.position.x + room.size.width / 2,
        room.position.y + room.size.height / 2
      );
      ctx.restore();
    });
  };

  const renderFurniture = (ctx: CanvasRenderingContext2D) => {
    plan.furniture.forEach((furniture) => {
      const isSelected = selectedType === "furniture" && selectedId === furniture.id;

      ctx.fillStyle = "#fff3e0";
      ctx.strokeStyle = isSelected ? "#f57c00" : "#ffb74d";
      ctx.lineWidth = isSelected ? 3 / zoom : 2 / zoom;

      ctx.fillRect(
        furniture.position.x,
        furniture.position.y,
        furniture.size.width,
        furniture.size.height
      );
      ctx.strokeRect(
        furniture.position.x,
        furniture.position.y,
        furniture.size.width,
        furniture.size.height
      );
    });
  };

  const renderUIOverlay = (ctx: CanvasRenderingContext2D) => {
    // Подсказки в углу
    ctx.save();
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";

    const hints = [
      "Колесо мыши - масштаб",
      "Shift + ЛКМ - панорамирование",
    ];

    if (tool === "wall" && wallDrawing.active) {
      hints.push("Двойной клик - завершить стену");
    }

    let y = dimensions.height - 10;
    hints.forEach((hint) => {
      ctx.fillText(hint, dimensions.width - 10, y);
      y -= 20;
    });

    ctx.restore();
  };

  // === ОБРАБОТЧИКИ СОБЫТИЙ ===

  const findNodeAtPosition = (worldPos: Point): string | null => {
    const threshold = 10 / zoom;
    for (const node of plan.nodes) {
      if (distance(node.position, worldPos) <= threshold) {
        return node.id;
      }
    }
    return null;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const screenPos = getMousePosition(e);
    const worldPos = screenToWorld(screenPos.x, screenPos.y);
    setMouseWorldPos(worldPos);

    // Проверка hover для узлов
    const hoveredNode = findNodeAtPosition(worldPos);
    setHoveredNodeId(hoveredNode);

    // Обработка drag
    if (isDragging && draggedId && draggedType) {
      const newWorldPos = screenToWorld(e.clientX - dragStart.x, e.clientY - dragStart.y);

      if (draggedType === "node") {
        moveNode(draggedId, newWorldPos);
      } else if (draggedType === "room") {
        updateRoom(draggedId, { position: newWorldPos });
      } else if (draggedType === "furniture") {
        updateFurniture(draggedId, { position: newWorldPos });
      }
      return;
    }

    // Обработка панорамирования
    if (isPanning) {
      const deltaX = e.clientX - panStart.x;
      const deltaY = e.clientY - panStart.y;

      setOffset({
        x: offset.x + deltaX,
        y: offset.y + deltaY,
      });

      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    // Snap
    if (tool === "wall" && plan.snapSettings.enabled) {
      const gridStep = realWorldSize.pixelsPerMeter / 2;
      const snap = findSnapPoint(worldPos, plan.snapSettings, plan.nodes, plan.walls, gridStep);

      if (snap) {
        setSnapPoint(snap.point);
      } else if (wallDrawing.active && wallDrawing.startNodeId) {
        const startNode = plan.nodes.find((n) => n.id === wallDrawing.startNodeId);
        if (startNode) {
          const ortho = snapToOrthogonal(startNode.position, worldPos);
          setSnapPoint(ortho || null);
        } else {
          setSnapPoint(null);
        }
      } else {
        setSnapPoint(null);
      }
    } else {
      setSnapPoint(null);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const screenPos = getMousePosition(e);
    const worldPos = screenToWorld(screenPos.x, screenPos.y);
    const clickedNode = findNodeAtPosition(worldPos);

    if (clickedNode && tool === "select") {
      select(clickedNode, "node");
      return;
    }

    const usePos = snapPoint || worldPos;

    if (tool === "wall") {
      if (!wallDrawing.active) {
        startWallDrawing(usePos);
      } else {
        continueWallDrawing(usePos);
      }
    } else if (tool === "room") {
      addRoom(usePos);
    } else if (tool === "furniture") {
      addFurniture(usePos);
    } else if (tool === "select") {
      clearSelection();
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === "wall" && wallDrawing.active) {
      e.preventDefault();
      finishWallDrawing();
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const screenPos = getMousePosition(e);
    const worldPos = screenToWorld(screenPos.x, screenPos.y);

    // Проверяем клик по узлу
    const nodeId = findNodeAtPosition(worldPos);
    if (nodeId && tool === "select") {
      setIsDragging(true);
      setDraggedId(nodeId);
      setDraggedType("node");
      setDragStart({ x: e.clientX - worldPos.x * zoom, y: e.clientY - worldPos.y * zoom });
      return;
    }

    // Панорамирование
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedId(null);
    setDraggedType(null);
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const worldPos = screenToWorld(mouseX, mouseY);

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, zoom * delta));

    const newOffset = {
      x: mouseX - worldPos.x * newZoom,
      y: mouseY - worldPos.y * newZoom,
    };

    setZoom(newZoom);
    setOffset(newOffset);
  };

  return (
    <div className="w-full h-full bg-white relative">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{
          cursor: isPanning
            ? "grabbing"
            : isDragging
            ? "move"
            : tool === "wall"
            ? "crosshair"
            : "default",
        }}
      />
    </div>
  );
}

