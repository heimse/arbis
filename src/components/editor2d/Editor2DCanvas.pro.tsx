"use client";

import * as React from "react";
import { useEditor2DStore } from "@/store/editor2dStore";
import type { Point, Wall, WallNode, Door, Window } from "@/types/plan";
import { getWallPolygon, getWallLength } from "@/lib/editor/walls";
import { findSnapPoint, renderSnapIndicator, snapToOrthogonal } from "@/lib/editor/snap";
import { distance, formatDimension, mmToPixels, pixelsToMm } from "@/lib/editor/geometry";

/**
 * Профессиональный 2D Canvas для редактора планировки
 * Поддерживает стены, двери, окна, snap, размерные линии
 */
export function Editor2DCanvas() {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = React.useState({ width: 800, height: 600 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [draggedId, setDraggedId] = React.useState<string | null>(null);
  const [draggedType, setDraggedType] = React.useState<"node" | "room" | "furniture" | null>(
    null
  );
  const [dragStart, setDragStart] = React.useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = React.useState(false);
  const [panStart, setPanStart] = React.useState<Point>({ x: 0, y: 0 });
  const [mouseWorldPos, setMouseWorldPos] = React.useState<Point>({ x: 0, y: 0 });

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
      if (svgRef.current) {
        const parent = svgRef.current.parentElement;
        if (parent) {
          setDimensions({
            width: parent.offsetWidth,
            height: parent.offsetHeight,
          });
        }
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Преобразование координат SVG в координаты планировки
  const screenToWorld = (screenX: number, screenY: number): Point => {
    return {
      x: (screenX - offset.x) / zoom,
      y: (screenY - offset.y) / zoom,
    };
  };

  // Получить координаты мыши
  const getMousePosition = (e: React.MouseEvent): Point => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return screenToWorld(x, y);
  };

  // Обработка движения мыши (для snap)
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const worldPos = getMousePosition(e);
    setMouseWorldPos(worldPos);

    // Обработка drag
    if (isDragging && draggedId && draggedType) {
      const newX = (e.clientX - dragStart.x - offset.x) / zoom;
      const newY = (e.clientY - dragStart.y - offset.y) / zoom;

      if (draggedType === "node") {
        moveNode(draggedId, { x: newX, y: newY });
      } else if (draggedType === "room") {
        updateRoom(draggedId, { position: { x: newX, y: newY } });
      } else if (draggedType === "furniture") {
        updateFurniture(draggedId, { position: { x: newX, y: newY } });
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

    // Snap только для инструмента стены
    if (tool === "wall" && plan.snapSettings.enabled) {
      const gridStep = realWorldSize.pixelsPerMeter / 2;
      const snap = findSnapPoint(
        worldPos,
        plan.snapSettings,
        plan.nodes,
        plan.walls,
        gridStep
      );

      if (snap) {
        setSnapPoint(snap.point);
      } else {
        // Snap к ортогональности если рисуем стену
        if (wallDrawing.active && wallDrawing.startNodeId) {
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
      }
    } else {
      setSnapPoint(null);
    }
  };

  // Обработка клика по SVG
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    // Проверяем, что клик был непосредственно по SVG
    if (
      e.target === svgRef.current ||
      (e.target as SVGElement).id === "grid" ||
      (e.target as SVGElement).id === "background"
    ) {
      const worldPos = snapPoint || mouseWorldPos;

      if (tool === "wall") {
        if (!wallDrawing.active) {
          // Начинаем рисовать стену
          startWallDrawing(worldPos);
        } else {
          // Продолжаем или заканчиваем
          continueWallDrawing(worldPos);
        }
      } else if (tool === "room") {
        addRoom(worldPos);
      } else if (tool === "furniture") {
        addFurniture(worldPos);
      } else if (tool === "select") {
        clearSelection();
      }
    }
  };

  // Двойной клик для завершения рисования стены
  const handleDoubleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (tool === "wall" && wallDrawing.active) {
      e.preventDefault();
      finishWallDrawing();
    }
  };

  // Начало перетаскивания узла
  const handleNodeMouseDown = (
    e: React.MouseEvent,
    nodeId: string,
    position: Point
  ) => {
    e.stopPropagation();
    if (tool !== "select") return;

    select(nodeId, "node");

    setIsDragging(true);
    setDraggedId(nodeId);
    setDraggedType("node");
    setDragStart({
      x: e.clientX - position.x * zoom - offset.x,
      y: e.clientY - position.y * zoom - offset.y,
    });
  };

  // Завершение перетаскивания
  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedId(null);
    setDraggedType(null);
    setIsPanning(false);
  };

  // Колесо мыши для масштабирования
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();

    const rect = svgRef.current?.getBoundingClientRect();
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

  // Начало панорамирования
  const handlePanStart = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  // Рендер фонового изображения
  const renderBackgroundImage = () => {
    if (!backgroundImage || !backgroundImage.visible) {
      return null;
    }

    const imageWidth =
      realWorldSize.widthMeters *
      realWorldSize.pixelsPerMeter *
      backgroundImage.scale;
    const imageHeight =
      realWorldSize.heightMeters *
      realWorldSize.pixelsPerMeter *
      backgroundImage.scale;

    return (
      <image
        id="background"
        href={backgroundImage.url}
        x={backgroundImage.offset.x}
        y={backgroundImage.offset.y}
        width={imageWidth}
        height={imageHeight}
        opacity={backgroundImage.opacity}
        preserveAspectRatio="xMinYMin meet"
        pointerEvents="none"
      />
    );
  };

  // Рендер сетки
  const renderGrid = () => {
    const gridStep = realWorldSize.pixelsPerMeter / 2;
    const lines = [];

    const startX = Math.floor((-offset.x / zoom) / gridStep) * gridStep;
    const endX =
      Math.ceil((dimensions.width - offset.x) / zoom / gridStep) * gridStep;
    const startY = Math.floor((-offset.y / zoom) / gridStep) * gridStep;
    const endY =
      Math.ceil((dimensions.height - offset.y) / zoom / gridStep) * gridStep;

    // Вертикальные линии
    for (let x = startX; x <= endX; x += gridStep) {
      const isMainLine = Math.abs(x % realWorldSize.pixelsPerMeter) < 0.1;
      lines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={startY}
          x2={x}
          y2={endY}
          stroke={isMainLine ? "#d0d0d0" : "#e8e8e8"}
          strokeWidth={isMainLine ? 1.5 / zoom : 1 / zoom}
        />
      );
    }

    // Горизонтальные линии
    for (let y = startY; y <= endY; y += gridStep) {
      const isMainLine = Math.abs(y % realWorldSize.pixelsPerMeter) < 0.1;
      lines.push(
        <line
          key={`h-${y}`}
          x1={startX}
          y1={y}
          x2={endX}
          y2={y}
          stroke={isMainLine ? "#d0d0d0" : "#e8e8e8"}
          strokeWidth={isMainLine ? 1.5 / zoom : 1 / zoom}
        />
      );
    }

    return <g id="grid">{lines}</g>;
  };

  // Рендер узлов стен
  const renderNodes = () => {
    return plan.nodes.map((node) => {
      const isSelected = selectedType === "node" && selectedId === node.id;
      const radius = 6 / zoom;

      return (
        <circle
          key={node.id}
          cx={node.position.x}
          cy={node.position.y}
          r={radius}
          fill={isSelected ? "#1976d2" : "#ffffff"}
          stroke={isSelected ? "#1976d2" : "#000000"}
          strokeWidth={2 / zoom}
          style={{ cursor: tool === "select" ? "move" : "pointer" }}
          onMouseDown={(e) =>
            handleNodeMouseDown(e, node.id, node.position)
          }
        />
      );
    });
  };

  // Рендер стен
  const renderWalls = () => {
    const visibleLayers = new Set(
      plan.layers.filter((l) => l.visible).map((l) => l.id)
    );

    return plan.walls.map((wall) => {
      if (!visibleLayers.has(wall.layerId)) return null;

      const layer = plan.layers.find((l) => l.id === wall.layerId);
      const polygon = getWallPolygon(wall, plan.nodes);
      if (polygon.length === 0) return null;

      const isSelected = selectedType === "wall" && selectedId === wall.id;
      const points = polygon.map((p) => `${p.x},${p.y}`).join(" ");

      // Цвет в зависимости от типа стены
      const fillColor =
        wall.type === "exterior"
          ? "#2c3e50"
          : wall.type === "interior"
          ? "#34495e"
          : "#7f8c8d";

      return (
        <g key={wall.id}>
          <polygon
            points={points}
            fill={fillColor}
            stroke={isSelected ? "#1976d2" : "#000000"}
            strokeWidth={isSelected ? 3 / zoom : 1 / zoom}
            opacity={layer?.opacity || 1}
            style={{ cursor: tool === "select" ? "pointer" : "default" }}
            onClick={(e) => {
              e.stopPropagation();
              if (tool === "select") {
                select(wall.id, "wall");
              }
            }}
          />
          {/* Размер стены */}
          {renderWallDimension(wall)}
        </g>
      );
    });
  };

  // Рендер размера стены
  const renderWallDimension = (wall: Wall) => {
    const startNode = plan.nodes.find((n) => n.id === wall.startNodeId);
    const endNode = plan.nodes.find((n) => n.id === wall.endNodeId);
    if (!startNode || !endNode) return null;

    const midX = (startNode.position.x + endNode.position.x) / 2;
    const midY = (startNode.position.y + endNode.position.y) / 2;

    const lengthPx = distance(startNode.position, endNode.position);
    const lengthMm = pixelsToMm(lengthPx, realWorldSize.pixelsPerMeter);
    const text = formatDimension(lengthMm, plan.measurementUnit);

    return (
      <text
        x={midX}
        y={midY}
        fontSize={12 / zoom}
        fill="#000000"
        textAnchor="middle"
        dominantBaseline="middle"
        pointerEvents="none"
        style={{ userSelect: "none" }}
      >
        {text}
      </text>
    );
  };

  // Рендер временной линии при рисовании стены
  const renderTempWall = () => {
    if (!wallDrawing.active || !wallDrawing.startNodeId) return null;

    const startNode = plan.nodes.find((n) => n.id === wallDrawing.startNodeId);
    if (!startNode) return null;

    const endPoint = snapPoint || mouseWorldPos;

    return (
      <line
        x1={startNode.position.x}
        y1={startNode.position.y}
        x2={endPoint.x}
        y2={endPoint.y}
        stroke="#1976d2"
        strokeWidth={2 / zoom}
        strokeDasharray={`${10 / zoom},${5 / zoom}`}
        pointerEvents="none"
      />
    );
  };

  // Рендер комнат (легаси)
  const renderRooms = () => {
    return plan.rooms.map((room) => {
      const isSelected = selectedType === "room" && selectedId === room.id;

      return (
        <g key={room.id}>
          <rect
            x={room.position.x}
            y={room.position.y}
            width={room.size.width}
            height={room.size.height}
            fill="#e3f2fd"
            stroke={isSelected ? "#1976d2" : "#90caf9"}
            strokeWidth={isSelected ? 3 / zoom : 2 / zoom}
            onClick={(e) => {
              e.stopPropagation();
              if (tool === "select") {
                select(room.id, "room");
              }
            }}
          />
          <text
            x={room.position.x + room.size.width / 2}
            y={room.position.y + room.size.height / 2}
            fontSize={16 / zoom}
            fill="#1976d2"
            textAnchor="middle"
            dominantBaseline="middle"
            pointerEvents="none"
          >
            {room.name}
          </text>
        </g>
      );
    });
  };

  // Рендер мебели (легаси)
  const renderFurniture = () => {
    return plan.furniture.map((furniture) => {
      const isSelected =
        selectedType === "furniture" && selectedId === furniture.id;

      return (
        <rect
          key={furniture.id}
          x={furniture.position.x}
          y={furniture.position.y}
          width={furniture.size.width}
          height={furniture.size.height}
          fill="#fff3e0"
          stroke={isSelected ? "#f57c00" : "#ffb74d"}
          strokeWidth={isSelected ? 3 / zoom : 2 / zoom}
          onClick={(e) => {
            e.stopPropagation();
            if (tool === "select") {
              select(furniture.id, "furniture");
            }
          }}
        />
      );
    });
  };

  return (
    <div className="w-full h-full bg-white relative">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        onClick={handleSvgClick}
        onDoubleClick={handleDoubleClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onMouseDown={handlePanStart}
        style={{ cursor: isPanning ? "grabbing" : "default" }}
      >
        <g transform={`translate(${offset.x}, ${offset.y}) scale(${zoom})`}>
          {renderBackgroundImage()}
          {renderGrid()}
          {renderWalls()}
          {renderRooms()}
          {renderFurniture()}
          {renderNodes()}
          {renderTempWall()}
          {snapPoint && renderSnapIndicator({ point: snapPoint, type: "grid" }, zoom)}
        </g>
      </svg>

      {/* Подсказки */}
      <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur px-3 py-2 rounded-md shadow-md text-xs text-muted-foreground border pointer-events-none">
        <div>Колесо мыши - масштаб</div>
        <div>Shift + ЛКМ - панорамирование</div>
        {tool === "wall" && wallDrawing.active && (
          <div className="text-primary mt-1">
            Двойной клик - завершить стену
          </div>
        )}
      </div>
    </div>
  );
}

