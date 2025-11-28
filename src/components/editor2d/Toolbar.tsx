'use client'

import React from 'react'
import { useEditor } from '@/store/editorStore'
import type { Tool } from '@/types/editor'
import {
  MousePointer2,
  Move,
  DoorOpen,
  SquareDashedBottom,
  Ruler,
  Box,
  Armchair,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'

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
        flex items-center justify-center w-10 h-10 rounded-md transition-colors
        ${
          isActive
            ? 'bg-blue-600 text-white'
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
  const { state, setTool, zoom, dispatch, undo, redo, canUndo, canRedo } = useEditor()

  const tools: Array<{ tool: Tool; icon: React.ReactNode; label: string }> = [
    { tool: 'select', icon: <MousePointer2 size={20} />, label: 'Выделение (V)' },
    { tool: 'wall', icon: <Move size={20} />, label: 'Стена (W)' },
    { tool: 'door', icon: <DoorOpen size={20} />, label: 'Дверь (D)' },
    { tool: 'window', icon: <SquareDashedBottom size={20} />, label: 'Окно (Shift+W)' },
    { tool: 'dimension', icon: <Ruler size={20} />, label: 'Размер' },
    { tool: 'room', icon: <Box size={20} />, label: 'Комната' },
    { tool: 'furniture', icon: <Armchair size={20} />, label: 'Мебель' },
  ]

  const handleZoomIn = () => {
    zoom(0.2)
  }

  const handleZoomOut = () => {
    zoom(-0.2)
  }

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
      <div className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        {/* Инструменты */}
        <div className="flex items-center gap-1">
          {tools.map((tool) => (
            <ToolButton
              key={tool.tool}
              tool={tool.tool}
              icon={tool.icon}
              label={tool.label}
              isActive={state.activeTool === tool.tool}
              onClick={() => setTool(tool.tool)}
            />
          ))}
        </div>

        {/* Разделитель */}
        <div className="w-px h-8 bg-gray-300" />

        {/* Действия */}
        <div className="flex items-center gap-1">
          <button
            onClick={undo}
            className="flex items-center justify-center w-10 h-10 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Отменить (Ctrl+Z)"
            disabled={!canUndo()}
          >
            <Undo size={20} />
          </button>

          <button
            onClick={redo}
            className="flex items-center justify-center w-10 h-10 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Повторить (Ctrl+Y)"
            disabled={!canRedo()}
          >
            <Redo size={20} />
          </button>
        </div>

        {/* Разделитель */}
        <div className="w-px h-8 bg-gray-300 dark:bg-gray-600" />

        {/* Zoom */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            className="flex items-center justify-center w-10 h-10 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            title="Уменьшить"
          >
            <ZoomOut size={20} />
          </button>

          <div className="px-2 text-sm text-gray-600 dark:text-gray-300 font-medium min-w-[60px] text-center">
            {Math.round((state.camera.zoom / 50) * 100)}%
          </div>

          <button
            onClick={handleZoomIn}
            className="flex items-center justify-center w-10 h-10 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            title="Увеличить"
          >
            <ZoomIn size={20} />
          </button>
        </div>

      </div>
    </div>
  )
}

