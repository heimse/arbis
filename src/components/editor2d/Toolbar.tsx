'use client'

import React from 'react'
import { useEditor } from '@/store/editorStore'
import type { Tool } from '@/types/editor'
import {
  MousePointer2,
  Minus,
  DoorOpen,
  RectangleHorizontal,
  Ruler,
  Square,
  Armchair,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Trash2,
} from 'lucide-react'
import { WallTool } from './tools/WallTool'

interface ToolButtonProps {
  tool: Tool
  icon: React.ReactNode
  label: string
  isActive: boolean
  onClick: () => void
}

function ToolButton({ tool, icon, label, isActive, onClick }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center justify-center w-9 h-9 rounded-md transition-colors
        ${
          isActive
            ? 'bg-blue-600 text-white dark:bg-blue-500'
            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
        }
      `}
      title={label}
    >
      {icon}
    </button>
  )
}

export function Toolbar() {
  const { state, setTool, zoom, dispatch, undo, redo, canUndo, canRedo, deleteSelected } = useEditor()

  const tools: Array<{ tool: Tool; icon: React.ReactNode; label: string }> = [
    { tool: 'select', icon: <MousePointer2 size={18} />, label: 'Выделение (V)' },
    { tool: 'wall', icon: <Minus size={18} />, label: 'Стена (W)' },
    { tool: 'door', icon: <DoorOpen size={18} />, label: 'Дверь (D)' },
    { tool: 'window', icon: <RectangleHorizontal size={18} />, label: 'Окно (Shift+W)' },
    { tool: 'dimension', icon: <Ruler size={18} />, label: 'Размер (R)' },
    { tool: 'room', icon: <Square size={18} />, label: 'Комната' },
    // TODO: Восстановить функционал инструмента мебель
    { tool: 'furniture', icon: <Armchair size={18} />, label: 'Мебель' },
  ]

  const handleZoomIn = () => {
    zoom(0.2)
  }

  const handleZoomOut = () => {
    zoom(-0.2)
  }

  const handleZoomReset = () => {
    dispatch({
      type: 'SET_CAMERA',
      camera: { zoom: 50, x: 0, y: 0 },
    })
  }

  const handleDelete = () => {
    if (state.selection.id && state.selection.type) {
      deleteSelected()
    }
  }

  const handleToolClick = (tool: Tool) => {
    // Если переключаемся с инструмента стены и рисуем - завершаем рисование
    if (state.activeTool === 'wall' && state.wallDrawingState.isDrawing) {
      WallTool.finishDrawing(dispatch)
    }
    setTool(tool)
  }

  const zoomPercent = Math.round((state.camera.zoom / 50) * 100)

  return (
    <>
      {/* Плавающая панель инструментов по центру внизу */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
        <div className="flex items-center gap-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-3 py-2 pointer-events-auto">
          {/* Undo/Redo */}
          <button
            onClick={undo}
            className="flex items-center justify-center w-9 h-9 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Отменить (Ctrl+Z)"
            disabled={!canUndo()}
          >
            <Undo size={16} />
          </button>
          <button
            onClick={redo}
            className="flex items-center justify-center w-9 h-9 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Повторить (Ctrl+Y)"
            disabled={!canRedo()}
          >
            <Redo size={16} />
          </button>

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1" />

          {/* Инструменты */}
          {tools.map((t) => (
            <ToolButton
              key={t.tool}
              tool={t.tool}
              icon={t.icon}
              label={t.label}
              isActive={state.activeTool === t.tool}
              onClick={() => handleToolClick(t.tool)}
            />
          ))}

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1" />

          {/* Кнопка удаления */}
          <button
            onClick={handleDelete}
            disabled={!state.selection.id || !state.selection.type}
            className="flex items-center justify-center w-9 h-9 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Удалить (Delete)"
          >
            <Trash2 size={16} />
          </button>

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1" />

          {/* Масштаб */}
          <button
            onClick={handleZoomOut}
            className="flex items-center justify-center w-9 h-9 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            title="Уменьшить"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={handleZoomReset}
            className="px-2 h-9 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-xs font-medium min-w-[3.5rem]"
            title="Сбросить масштаб"
          >
            {zoomPercent}%
          </button>
          <button
            onClick={handleZoomIn}
            className="flex items-center justify-center w-9 h-9 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            title="Увеличить"
          >
            <ZoomIn size={16} />
          </button>
        </div>

        {/* Статус рисования стены */}
        {state.wallDrawingState.isDrawing && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg text-sm font-medium whitespace-nowrap">
            Кликайте для добавления стен • Двойной клик для завершения • ESC для отмены
          </div>
        )}
      </div>
    </>
  )
}

