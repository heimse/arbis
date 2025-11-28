'use client'

import React, { useState, useEffect, useRef } from 'react'
import { EditorProvider, useEditor } from '@/store/editorStore'
import { Canvas } from './Canvas'
import { Toolbar } from './Toolbar'
import { RightPanel } from './RightPanel'
import { KeyboardHandler } from './KeyboardHandler'
import { HistoryIndicator } from './HistoryIndicator'
import { EditableProjectName } from './EditableProjectName'
import { Save, Maximize2, Menu } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'

interface Editor2DProps {
  projectId: string
  projectName?: string
}

interface EditorContentProps {
  projectId: string
  projectName: string
}

function EditorContent({ projectId, projectName = 'Без названия' }: EditorContentProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [currentProjectName, setCurrentProjectName] = useState(projectName)
  const [isSaving, setIsSaving] = useState(false)

  const handleProjectNameSave = async (newName: string) => {
    setCurrentProjectName(newName)
    setIsSaving(true)

    try {
      const response = await fetch(`/api/projects/${projectId}/name`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newName }),
      })

      if (!response.ok) {
        throw new Error('Failed to save project name')
      }

      const data = await response.json()
      console.log('Название проекта сохранено:', data.title)
    } catch (error) {
      console.error('Ошибка при сохранении названия проекта:', error)
      // TODO: Показать toast с ошибкой
    } finally {
      setIsSaving(false)
    }
  }

  // Обновляем размер canvas при изменении размера контейнера
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setCanvasSize({
          width: rect.width,
          height: rect.height,
        })
      }
    }

    updateSize()

    // Используем ResizeObserver для отслеживания изменений размера контейнера
    const resizeObserver = new ResizeObserver(() => {
      updateSize()
    })

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    // Также слушаем изменения размера окна
    window.addEventListener('resize', updateSize)
    
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateSize)
    }
  }, [])

  // Обработка полноэкранного режима
  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.parentElement?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-950">
      {/* Обработчик клавиатуры */}
      <KeyboardHandler />
      
      {/* Индикатор истории */}
      <HistoryIndicator />

      {/* Шапка */}
      <div className="flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="lg:hidden flex items-center justify-center w-10 h-10 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={isSidebarCollapsed ? 'Показать меню' : 'Скрыть меню'}
          >
            <Menu size={20} />
          </button>
          <div>
            <EditableProjectName 
              initialName={currentProjectName} 
              onSave={handleProjectNameSave}
              isSaving={isSaving}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">2D Планер</p>
          </div>
        </div>

        <div className="flex items-center gap-2">

          <ThemeToggle />

          <button
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            title="Сохранить"
          >
            <Save size={16} />
            <span>Сохранить</span>
          </button>

          <button
            onClick={handleFullscreen}
            className="flex items-center justify-center w-10 h-10 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={isFullscreen ? 'Выйти из полноэкранного режима' : 'Полноэкранный режим'}
          >
            <Maximize2 size={20} />
          </button>
        </div>
      </div>

      {/* Основная область */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div ref={containerRef} className="flex-1 relative bg-gray-50 dark:bg-gray-900">
          <Canvas width={canvasSize.width} height={canvasSize.height} />
          
          {/* Toolbar (плавающий) */}
          <Toolbar />

          {/* Статус-бар */}
          <StatusBar />
        </div>

        {/* Правая панель */}
        <RightPanel />
      </div>
    </div>
  )
}

// Статус-бар с подсказками
function StatusBar() {
  const { state, canUndo, canRedo } = useEditor()

  const getToolHint = () => {
    switch (state.activeTool) {
      case 'wall':
        if (state.wallDrawingState.isDrawing) {
          return (
            <>
              <div className="font-medium">Рисование стены</div>
              <div className="text-gray-400 dark:text-gray-500 mt-1">
                Стены соединяются под прямым углом (90°)
              </div>
              <div className="text-gray-400 dark:text-gray-500">
                <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Ctrl</kbd> + колесо - изменить угол
              </div>
              <div className="text-gray-400 dark:text-gray-500">
                <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">ESC</kbd> - завершить
              </div>
            </>
          )
        }
        return 'Нажмите W для стены'
      case 'door':
        return 'Кликните на стену для добавления двери'
      case 'window':
        return 'Кликните на стену для добавления окна'
      case 'select':
        if (state.selection.id && state.selection.type) {
          return (
            <>
              <div className="font-medium">Объект выделен</div>
              <div className="text-gray-400 dark:text-gray-500 mt-1">
                Перетащите для перемещения
              </div>
              <div className="text-gray-400 dark:text-gray-500">
                {state.selection.type === 'node' && 'Узлы перемещают связанные стены'}
                {state.selection.type === 'wall' && 'Стена перемещается целиком (оба узла)'}
                {(state.selection.type === 'door' || state.selection.type === 'window') && 
                  'Перемещение вдоль стены'}
              </div>
              <div className="text-gray-400 dark:text-gray-500 mt-1">
                Измените размер через свойства в правой панели
              </div>
            </>
          )
        }
        return 'Кликните на объект для выделения'
      default:
        return (
          <>
            Нажмите <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">V</kbd> для выделения,{' '}
            <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">W</kbd> для стены
          </>
        )
    }
  }

  return (
    <div className="absolute bottom-4 left-4 space-y-2">
      {/* Основные подсказки */}
      <div className="px-3 py-2 bg-white dark:bg-gray-800 rounded-md shadow-md border border-gray-200 dark:border-gray-700 max-w-xs">
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          {getToolHint()}
        </div>
      </div>

      {/* Индикатор истории */}
      <div className="px-3 py-1.5 bg-white dark:bg-gray-800 rounded-md shadow-md border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500 dark:text-gray-400">История:</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {state.historyIndex}/{state.history.length - 1}
          </span>
          <span className="text-gray-400 dark:text-gray-500">|</span>
          <span className={canUndo() ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-600'}>
            Undo: {canUndo() ? 'Да' : 'Нет'}
          </span>
          <span className={canRedo() ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-600'}>
            Redo: {canRedo() ? 'Да' : 'Нет'}
          </span>
        </div>
      </div>
    </div>
  )
}

export function Editor2D({ projectId, projectName }: Editor2DProps) {
  return (
    <EditorProvider>
      <EditorContent 
        projectId={projectId} 
        projectName={projectName || 'Без названия'} 
      />
    </EditorProvider>
  )
}

