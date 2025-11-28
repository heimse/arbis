'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Pencil, Check, X } from 'lucide-react'

interface EditableProjectNameProps {
  initialName: string
  onSave: (newName: string) => void | Promise<void>
  isSaving?: boolean
}

export function EditableProjectName({ initialName, onSave, isSaving = false }: EditableProjectNameProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(initialName)
  const [tempName, setTempName] = useState(initialName)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isSavingLocal, setIsSavingLocal] = useState(false)

  // Синхронизируем внутреннее состояние с пропом initialName
  useEffect(() => {
    setName(initialName)
    setTempName(initialName)
  }, [initialName])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = async () => {
    const trimmedName = tempName.trim()
    if (trimmedName && trimmedName !== name) {
      setName(trimmedName)
      setIsSavingLocal(true)
      try {
        await onSave(trimmedName)
      } finally {
        setIsSavingLocal(false)
      }
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setTempName(name)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={tempName}
          onChange={(e) => setTempName(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="text-lg font-semibold text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxLength={50}
        />
        <button
          onClick={handleSave}
          className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
          title="Сохранить (Enter)"
        >
          <Check size={16} />
        </button>
        <button
          onClick={handleCancel}
          className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
          title="Отменить (Esc)"
        >
          <X size={16} />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="group flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-2 py-1 -mx-2 transition-colors"
      title="Кликните для редактирования"
      disabled={isSaving || isSavingLocal}
    >
      <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        {name}
      </h1>
      {(isSaving || isSavingLocal) ? (
        <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      ) : (
        <Pencil 
          size={14} 
          className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" 
        />
      )}
    </button>
  )
}

