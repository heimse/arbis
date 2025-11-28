import React from 'react'
import { Editor2D } from '@/components/editor2d/Editor2D'

/**
 * Страница для тестирования редактора
 */
export default function EditorTestPage() {
  return (
    <div className="h-screen w-screen">
      <Editor2D projectId="test" projectName="Тестовый проект" />
    </div>
  )
}

