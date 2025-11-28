"use client";

import * as React from "react";
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Minus,
  DoorOpen,
  RectangleHorizontal,
  Square,
  Armchair,
  Circle,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEditor2DStore } from "@/store/editor2dStore";
import type { Layer } from "@/types/plan";

/**
 * Элемент дерева слоёв
 */
type TreeItem = {
  id: string;
  type: "layer" | "wall" | "door" | "window" | "room" | "furniture" | "node";
  name: string;
  layerId?: string;
  icon: React.ReactNode;
  visible: boolean;
  locked: boolean;
  children?: TreeItem[];
};

/**
 * Редактор слоёв в стиле Figma
 */
export function LayersPanelFigma() {
  const {
    plan,
    activeLayerId,
    selectedId,
    selectedType,
    setActiveLayer,
    toggleLayerVisibility,
    toggleLayerLock,
    addLayer,
    deleteLayer,
    updateLayer,
    select,
    clearSelection,
  } = useEditor2DStore();

  const [expandedLayers, setExpandedLayers] = React.useState<Set<string>>(
    new Set(plan.layers.map((l) => l.id))
  );
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState("");

  // Построить дерево элементов
  const buildTree = React.useCallback((): TreeItem[] => {
    const sortedLayers = [...plan.layers].sort((a, b) => b.order - a.order);

    return sortedLayers.map((layer) => {
      const children: TreeItem[] = [];

      // Добавляем стены этого слоя
      plan.walls
        .filter((w) => w.layerId === layer.id)
        .forEach((wall) => {
          const startNode = plan.nodes.find((n) => n.id === wall.startNodeId);
          const endNode = plan.nodes.find((n) => n.id === wall.endNodeId);
          const wallName = startNode && endNode
            ? `Стена (${Math.round(
                Math.sqrt(
                  Math.pow(endNode.position.x - startNode.position.x, 2) +
                    Math.pow(endNode.position.y - startNode.position.y, 2)
                )
              )})`
            : "Стена";

          children.push({
            id: wall.id,
            type: "wall",
            name: wallName,
            layerId: layer.id,
            icon: <Minus className="h-3 w-3" />,
            visible: layer.visible,
            locked: layer.locked,
          });
        });

      // Добавляем двери этого слоя
      plan.doors
        .filter((d) => d.layerId === layer.id)
        .forEach((door) => {
          children.push({
            id: door.id,
            type: "door",
            name: `Дверь ${door.width}мм`,
            layerId: layer.id,
            icon: <DoorOpen className="h-3 w-3" />,
            visible: layer.visible,
            locked: layer.locked,
          });
        });

      // Добавляем окна этого слоя
      plan.windows
        .filter((w) => w.layerId === layer.id)
        .forEach((window) => {
          children.push({
            id: window.id,
            type: "window",
            name: `Окно ${window.width}мм`,
            layerId: layer.id,
            icon: <RectangleHorizontal className="h-3 w-3" />,
            visible: layer.visible,
            locked: layer.locked,
          });
        });

      // Добавляем комнаты
      plan.rooms.forEach((room) => {
        children.push({
          id: room.id,
          type: "room",
          name: room.name,
          layerId: layer.id,
          icon: <Square className="h-3 w-3" />,
          visible: layer.visible,
          locked: layer.locked,
        });
      });

      // Добавляем мебель
      plan.furniture.forEach((furniture) => {
        children.push({
          id: furniture.id,
          type: "furniture",
          name: furniture.type,
          layerId: layer.id,
          icon: <Armchair className="h-3 w-3" />,
          visible: layer.visible,
          locked: layer.locked,
        });
      });

      return {
        id: layer.id,
        type: "layer",
        name: layer.name,
        icon: <Circle className="h-3 w-3" style={{ fill: layer.color }} />,
        visible: layer.visible,
        locked: layer.locked,
        children,
      };
    });
  }, [plan]);

  const tree = buildTree();

  // Переключить раскрытие слоя
  const toggleExpanded = (layerId: string) => {
    setExpandedLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }
      return next;
    });
  };

  // Начать редактирование имени
  const startEditing = (item: TreeItem) => {
    setEditingId(item.id);
    setEditingName(item.name);
  };

  // Сохранить новое имя
  const saveEdit = () => {
    if (editingId && editingName.trim()) {
      const item = tree.find((t) => t.id === editingId);
      if (item && item.type === "layer") {
        updateLayer(editingId, { name: editingName.trim() });
      }
      // TODO: добавить updateRoom, updateWall и т.д.
    }
    setEditingId(null);
    setEditingName("");
  };

  // Отменить редактирование
  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  // Обработка клика по элементу
  const handleItemClick = (item: TreeItem) => {
    if (item.type === "layer") {
      setActiveLayer(item.id);
    } else {
      select(item.id, item.type as any);
    }
  };

  // Рендер элемента дерева
  const renderTreeItem = (item: TreeItem, depth: number = 0) => {
    const isExpanded = expandedLayers.has(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const isActive = item.type === "layer" && item.id === activeLayerId;
    const isSelected =
      item.type !== "layer" && selectedId === item.id && selectedType === item.type;
    const isEditing = editingId === item.id;

    return (
      <div key={item.id}>
        {/* Сам элемент */}
        <div
          className={`group/item flex items-center gap-1 px-2 py-1 hover:bg-muted/50 transition-colors ${
            isActive || isSelected
              ? "bg-primary/10 border-l-2 border-primary"
              : ""
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {/* Стрелка раскрытия */}
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleExpanded(item.id)}
              className="h-5 w-5 p-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          ) : (
            <div className="w-5" />
          )}

          {/* Иконка типа */}
          <div className="flex-shrink-0 text-muted-foreground">{item.icon}</div>

          {/* Название */}
          {isEditing ? (
            <div className="flex-1 flex items-center gap-1">
              <Input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit();
                  if (e.key === "Escape") cancelEdit();
                }}
                onBlur={saveEdit}
                autoFocus
                className="h-6 text-xs"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={saveEdit}
                className="h-6 w-6 p-0"
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelEdit}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div
              className="flex-1 text-xs font-medium truncate cursor-pointer"
              onClick={() => handleItemClick(item)}
              onDoubleClick={() => startEditing(item)}
            >
              {item.name}
            </div>
          )}

          {/* Действия */}
          <div className="flex items-center gap-0.5">
            {/* Видимость */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                if (item.type === "layer") {
                  toggleLayerVisibility(item.id);
                }
              }}
              className="h-6 w-6 p-0 opacity-0 group-hover/item:opacity-100 transition-opacity"
              title={item.visible ? "Скрыть" : "Показать"}
            >
              {item.visible ? (
                <Eye className="h-3 w-3" />
              ) : (
                <EyeOff className="h-3 w-3 text-muted-foreground" />
              )}
            </Button>

            {/* Блокировка */}
            {item.type === "layer" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLayerLock(item.id);
                }}
                className="h-6 w-6 p-0 opacity-0 group-hover/item:opacity-100 transition-opacity"
                title={item.locked ? "Разблокировать" : "Заблокировать"}
              >
                {item.locked ? (
                  <Lock className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <Unlock className="h-3 w-3" />
                )}
              </Button>
            )}

            {/* Редактировать */}
            {item.type === "layer" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing(item);
                }}
                className="h-6 w-6 p-0 opacity-0 group-hover/item:opacity-100 transition-opacity"
                title="Переименовать"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            )}

            {/* Удалить слой */}
            {item.type === "layer" && plan.layers.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Удалить слой "${item.name}"?`)) {
                    deleteLayer(item.id);
                  }
                }}
                className="h-6 w-6 p-0 opacity-0 group-hover/item:opacity-100 transition-opacity hover:text-destructive"
                title="Удалить слой"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Дочерние элементы */}
        {hasChildren && isExpanded && (
          <div className="group">
            {item.children!.map((child) => renderTreeItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Слои</span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Раскрыть/свернуть все
                if (expandedLayers.size === plan.layers.length) {
                  setExpandedLayers(new Set());
                } else {
                  setExpandedLayers(new Set(plan.layers.map((l) => l.id)));
                }
              }}
              className="h-7 w-7 p-0"
              title="Раскрыть/свернуть все"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => addLayer(`Слой ${plan.layers.length + 1}`)}
              className="h-7 w-7 p-0"
              title="Добавить слой"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="space-y-0.5 px-2 pb-2 group">
            {tree.map((item) => renderTreeItem(item, 0))}
          </div>
        </ScrollArea>

        {/* Информация */}
        <div className="border-t p-3 text-xs text-muted-foreground space-y-1">
          <div>📋 {plan.walls.length} стен</div>
          <div>🚪 {plan.doors.length} дверей</div>
          <div>🪟 {plan.windows.length} окон</div>
          <div>
            🏠 {plan.rooms.length} комнат / 🪑 {plan.furniture.length} мебели
          </div>
          <div className="pt-1 border-t text-[10px]">
            Двойной клик - переименовать
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

