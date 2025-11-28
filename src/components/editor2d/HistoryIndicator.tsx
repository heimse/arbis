'use client'

import React, { useEffect, useState } from 'react'
import { useEditor } from '@/store/editorStore'
import { Undo, Redo } from 'lucide-react'

/**
 * Индикатор для визуального отображения Undo/Redo действий
 */
export function HistoryIndicator() {
  const { state } = useEditor()
  const [lastAction, setLastAction] = useState<'undo' | 'redo' | null>(null)
  const [showNotification, setShowNotification] = useState(false)
  const prevHistoryIndex = React.useRef(state.historyIndex)

  useEffect(() => {
    // Определяем, было ли Undo или Redo
    if (state.historyIndex < prevHistoryIndex.current) {
      setLastAction('undo')
      setShowNotification(true)
    } else if (state.historyIndex > prevHistoryIndex.current) {
      setLastAction('redo')
      setShowNotification(true)
    }

    prevHistoryIndex.current = state.historyIndex

    // Скрываем уведомление через 2 секунды
    if (showNotification) {
      const timer = setTimeout(() => {
        setShowNotification(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [state.historyIndex, showNotification])

  if (!showNotification) return null

  return (
    <div className="fixed top-20 right-4 z-50 animate-in fade-in slide-in-from-right-5 duration-300">
      <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        {lastAction === 'undo' ? (
          <>
            <Undo size={16} className="text-blue-600" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Отменено</span>
          </>
        ) : (
          <>
            <Redo size={16} className="text-blue-600" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Возвращено</span>
          </>
        )}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {state.historyIndex}/{state.history.length - 1}
        </div>
      </div>
    </div>
  )
}

