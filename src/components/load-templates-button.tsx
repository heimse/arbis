'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function LoadTemplatesButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLoadTemplates = async () => {
    if (isLoading) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/templates/load', {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Ошибка при загрузке шаблонов')
      }

      const data = await response.json()
      alert(`Успешно загружено ${data.projects.length} планировок!`)
      
      // Обновляем страницу, чтобы показать новые проекты
      router.refresh()
    } catch (error) {
      console.error('Ошибка при загрузке шаблонов:', error)
      alert(error instanceof Error ? error.message : 'Ошибка при загрузке шаблонов')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleLoadTemplates}
      disabled={isLoading}
      variant="outline"
      className="w-full"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Загрузка...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Загрузить шаблоны планировок
        </>
      )}
    </Button>
  )
}


