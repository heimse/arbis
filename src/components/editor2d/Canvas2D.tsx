'use client'

import React, { useRef, useEffect, useCallback, useState } from 'react'
import { useEditor2DStore } from '@/store/editor2dStore'
import { screenToWorld } from '@/lib/editor/geometry'
import type { Point } from '@/types/plan'
import type { Camera } from '@/types/editor'
import { CanvasRenderer2D } from './CanvasRenderer2D'
import { RoomTool } from './tools/RoomTool'

interface Canvas2DProps {
  width: number
  height: number
}

export function Canvas2D({ width, height }: Canvas2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const {
    plan,
    tool,
    selectedId,
    selectedType,
    zoom,
    offset,
    addRoom,
    select,
    clearSelection,
  } = useEditor2DStore()

  const isPanning = useRef(false)
  const lastMousePos = useRef<Point>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)

  // Камера для рендеринга
  const camera: Camera = {
    x: offset.x,
    y: offset.y,
    zoom: zoom,
  }

  // Рендеринг
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Очищаем canvas
    ctx.clearRect(0, 0, width, height)

    // Создаём renderer
    const renderer = new CanvasRenderer2D(ctx, camera, width, height)

    // Рисуем фон (проверяем темную тему)
    const isDark = document.documentElement.classList.contains('dark')
    ctx.fillStyle = isDark ? '#0a0a0a' : '#fafafa'
    ctx.fillRect(0, 0, width, height)

    // Рисуем стены
    renderer.renderWalls(plan.walls, plan.nodes, plan.layers, {
      id: selectedId,
      type: selectedType,
    }, isDragging)

    // Рисуем узлы
    renderer.renderNodes(plan.nodes, {
      id: selectedId,
      type: selectedType,
    }, isDragging)

    // Рисуем комнаты (новая логика с полигонами)
    renderer.renderRooms(
      plan.rooms,
      plan.layers,
      {
        id: selectedId,
        type: selectedType,
      },
      isDragging
    )

    // TODO: Добавить рендеринг дверей, окон, размерных линий
  }, [plan, selectedId, selectedType, camera, width, height, isDragging])

  // Обновляем рендеринг при изменении данных
  useEffect(() => {
    render()
  }, [render])

  // Обработка кликов мыши
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const screenPos: Point = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }

      const worldPos = screenToWorld(screenPos, camera)

      // Middle mouse или Shift + Left mouse для pan
      if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        isPanning.current = true
        lastMousePos.current = screenPos
        e.preventDefault()
        return
      }

      // Левая кнопка мыши
      if (e.button === 0) {
        // Обработка в зависимости от активного инструмента
        switch (tool) {
          case 'room':
            RoomTool.handleClick(worldPos, addRoom)
            break

          case 'select':
            // TODO: Реализовать выбор объектов
            clearSelection()
            break

          default:
            break
        }
      }
    },
    [tool, addRoom, clearSelection, camera]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const screenPos: Point = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }

      if (isPanning.current) {
        const dx = screenPos.x - lastMousePos.current.x
        const dy = screenPos.y - lastMousePos.current.y

        // TODO: Реализовать pan через setOffset
        lastMousePos.current = screenPos
      }
    },
    []
  )

  const handleMouseUp = useCallback(() => {
    isPanning.current = false
    setIsDragging(false)
  }, [])

  // Обработка колесика мыши для зума
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      // TODO: Реализовать zoom через setZoom
    },
    []
  )

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      className="absolute inset-0 cursor-crosshair"
    />
  )
}

