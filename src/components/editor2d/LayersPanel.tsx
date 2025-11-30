"use client";

import * as React from "react";
import { Eye, EyeOff, Lock, Unlock, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEditor2DStore } from "@/store/editor2dStore";

/**
 * Панель управления слоями
 */
export function LayersPanel() {
  const {
    plan,
    activeLayerId,
    setActiveLayer,
    toggleLayerVisibility,
    toggleLayerLock,
    addLayer,
    deleteLayer,
  } = useEditor2DStore();

  const [newLayerName, setNewLayerName] = React.useState("");

  const handleAddLayer = () => {
    if (newLayerName.trim()) {
      addLayer(newLayerName.trim());
      setNewLayerName("");
    }
  };

  // Сортируем слои по порядку
  const sortedLayers = [...plan.layers].sort((a, b) => a.order - b.order);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span>Слои</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => addLayer(`Слой ${plan.layers.length + 1}`)}
            className="h-7 w-7 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Список слоёв */}
        <div className="space-y-1">
          {sortedLayers.map((layer) => {
            const isActive = layer.id === activeLayerId;
            const canDelete = plan.layers.length > 1;

            return (
              <div
                key={layer.id}
                className={`flex items-center gap-2 p-2 rounded-md border transition-colors ${
                  isActive
                    ? "bg-primary/10 border-primary"
                    : "hover:bg-muted border-transparent"
                }`}
                onClick={() => setActiveLayer(layer.id)}
                style={{ cursor: "pointer" }}
              >
                {/* Цветовой индикатор */}
                <div
                  className="w-3 h-3 rounded-sm border"
                  style={{ backgroundColor: layer.color }}
                />

                {/* Название слоя */}
                <div className="flex-1 text-sm font-medium truncate">
                  {layer.name}
                </div>

                {/* Кнопки управления */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLayerVisibility(layer.id);
                    }}
                    className="h-6 w-6 p-0"
                    title={
                      layer.visible ? "Скрыть слой" : "Показать слой"
                    }
                  >
                    {layer.visible ? (
                      <Eye className="h-3 w-3" />
                    ) : (
                      <EyeOff className="h-3 w-3 text-muted-foreground" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLayerLock(layer.id);
                    }}
                    className="h-6 w-6 p-0"
                    title={
                      layer.locked
                        ? "Разблокировать слой"
                        : "Заблокировать слой"
                    }
                  >
                    {layer.locked ? (
                      <Lock className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <Unlock className="h-3 w-3" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (canDelete) {
                        deleteLayer(layer.id);
                      }
                    }}
                    disabled={!canDelete}
                    className="h-6 w-6 p-0"
                    title={
                      canDelete
                        ? "Удалить слой"
                        : "Нельзя удалить последний слой"
                    }
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Добавление нового слоя */}
        <div className="pt-2 border-t">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Название слоя..."
              value={newLayerName}
              onChange={(e) => setNewLayerName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddLayer();
                }
              }}
              className="h-8 text-sm"
            />
            <Button
              onClick={handleAddLayer}
              disabled={!newLayerName.trim()}
              size="sm"
              className="h-8"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Подсказка */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          <div>• Кликните по слою, чтобы сделать его активным</div>
          <div>• Новые объекты добавляются на активный слой</div>
          <div>• Скрытые и заблокированные слои нельзя редактировать</div>
        </div>
      </CardContent>
    </Card>
  );
}




