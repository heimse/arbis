'use client'

import React, { useRef, useEffect, useCallback, useState } from 'react'
import { useEditor } from '@/store/editorStore'
import { worldToScreen, screenToWorld, snapToGrid, snapToNode, distance } from '@/lib/editor/geometry'
import { SNAP_THRESHOLD } from '@/lib/editor/utils'
import type { Point } from '@/types/editor'
import { CanvasRenderer } from './CanvasRenderer'
import { WallTool } from './tools/WallTool'
import { DoorTool } from './tools/DoorTool'
import { WindowTool } from './tools/WindowTool'
import { SelectTool } from './tools/SelectTool'

interface CanvasProps {
  width: number
  height: number
}

export function Canvas({ width, height }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { state, pan, zoom, dispatch } = useEditor()
  
  const isPanning = useRef(false)
  const lastMousePos = useRef<Point>({ x: 0, y: 0 })
  const currentMouseWorldPos = useRef<Point>({ x: 0, y: 0 })
  const [isCtrlPressed, setIsCtrlPressed] = useState(false)
  
  // Состояние для drag
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartPos, setDragStartPos] = useState<Point | null>(null)
  const draggedObject = useRef<{ type: 'node' | 'door' | 'window'; id: string } | null>(null)

  // Рендеринг
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Очищаем canvas
    ctx.clearRect(0, 0, width, height)

    // Создаём renderer
    const renderer = new CanvasRenderer(ctx, state.camera, width, height)

    // Рисуем фон (проверяем темную тему)
    const isDark = document.documentElement.classList.contains('dark')
    ctx.fillStyle = isDark ? '#0a0a0a' : '#fafafa'
    ctx.fillRect(0, 0, width, height)

    // Рисуем сетку
    if (state.gridSettings.visible) {
      renderer.renderGrid(state.gridSettings)
    }

    // Рисуем стены
    renderer.renderWalls(state.walls, state.nodes, state.layers, state.selection, isDragging)

    // Рисуем двери
    renderer.renderDoors(state.doors, state.walls, state.nodes, state.layers, state.selection, isDragging)

    // Рисуем окна
    renderer.renderWindows(state.windows, state.walls, state.nodes, state.layers, state.selection, isDragging)

    // Рисуем узлы (при выделении или в режиме редактирования)
    if (state.activeTool === 'select' || state.activeTool === 'wall') {
      renderer.renderNodes(state.nodes, state.selection, isDragging)
    }

    // Рисуем процесс рисования стены
    if (state.wallDrawingState.isDrawing && state.wallDrawingState.nodes.length > 0) {
      renderer.renderWallDrawing(
        state.wallDrawingState.nodes,
        state.nodes,
        currentMouseWorldPos.current
      )
    }

    // Рисуем курсор snap
    if (state.activeTool === 'wall') {
      const snapped = getSnappedPosition(currentMouseWorldPos.current)
      if (snapped.snapped) {
        renderer.renderSnapIndicator(snapped.position)
      }
    }
  }, [state, width, height])

  // Вычисляем привязку
  const getSnappedPosition = useCallback((worldPos: Point): { position: Point; snapped: boolean } => {
    // Для инструмента Wall используем специальную логику с ортогональным snap
    if (state.activeTool === 'wall' && state.wallDrawingState.isDrawing) {
      const snappedPos = WallTool.getSnappedPosition(worldPos, state, isCtrlPressed)
      return { position: snappedPos, snapped: true }
    }

    if (!state.snapMode.toGrid && !state.snapMode.toNodes) {
      return { position: worldPos, snapped: false }
    }

    // Привязка к узлам (приоритет)
    if (state.snapMode.toNodes) {
      const nodeSnap = snapToNode(worldPos, state.nodes, SNAP_THRESHOLD.node)
      if (nodeSnap) {
        return {
          position: { x: nodeSnap.node.x, y: nodeSnap.node.y },
          snapped: true,
        }
      }
    }

    // Привязка к сетке
    if (state.snapMode.toGrid) {
      const gridPos = snapToGrid(worldPos, state.gridSettings.spacing)
      if (distance(worldPos, gridPos) < SNAP_THRESHOLD.grid) {
        return { position: gridPos, snapped: true }
      }
    }

    return { position: worldPos, snapped: false }
  }, [state, isCtrlPressed])

  // Обработчики мыши
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const screenPos: Point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }

    const worldPos = screenToWorld(screenPos, state.camera)
    const snappedPos = getSnappedPosition(worldPos)

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
      switch (state.activeTool) {
        case 'wall':
          WallTool.handleClick(snappedPos.position, state, dispatch)
          break
          
        case 'door':
          DoorTool.handleClick(worldPos, state, dispatch)
          break
          
        case 'window':
          WindowTool.handleClick(worldPos, state, dispatch)
          break
          
        case 'select': {
          // Проверяем, есть ли объект под курсором для drag
          const clickedObject = SelectTool.findObjectAtPoint(worldPos, state)
          
          if (clickedObject) {
            // Начинаем drag - сохраняем снапшот в истории
            dispatch({ type: 'START_DRAG' })
            setIsDragging(true)
            setDragStartPos(worldPos)
            draggedObject.current = clickedObject
            
            // Выделяем объект (если ещё не выделен)
            if (state.selection.type !== clickedObject.type || state.selection.id !== clickedObject.id) {
              SelectTool.handleClick(worldPos, state, dispatch)
            }
          } else {
            // Просто клик для выделения/снятия выделения
            SelectTool.handleClick(worldPos, state, dispatch)
          }
          break
        }
      }
    }
  }, [state, dispatch, getSnappedPosition])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const screenPos: Point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }

    const worldPos = screenToWorld(screenPos, state.camera)
    currentMouseWorldPos.current = worldPos

    // Drag объекта
    if (isDragging && dragStartPos && draggedObject.current) {
      const dx = worldPos.x - dragStartPos.x
      const dy = worldPos.y - dragStartPos.y
      
      SelectTool.handleDrag(
        draggedObject.current,
        dx,
        dy,
        worldPos,
        state,
        dispatch
      )
      
      setDragStartPos(worldPos)
      render()
      return
    }

    // Pan
    if (isPanning.current) {
      const dx = screenPos.x - lastMousePos.current.x
      const dy = screenPos.y - lastMousePos.current.y
      pan(-dx, -dy)
      lastMousePos.current = screenPos
    }

    // Изменяем курсор при hover над объектом в режиме Select
    if (state.activeTool === 'select' && !isDragging && !isPanning.current) {
      const objectAtPoint = SelectTool.findObjectAtPoint(worldPos, state)
      if (objectAtPoint && canvas) {
        canvas.style.cursor = 'grab'
      } else if (canvas) {
        canvas.style.cursor = 'default'
      }
    }

    render()
  }, [state, isDragging, dragStartPos, pan, render])

  const handleMouseUp = useCallback(() => {
    isPanning.current = false
    
    // Завершаем drag - сохраняем финальный снапшот в истории
    if (isDragging) {
      dispatch({ type: 'END_DRAG' })
      setIsDragging(false)
      setDragStartPos(null)
      draggedObject.current = null
    }
  }, [isDragging, dispatch])

  const handleMouseLeave = useCallback(() => {
    // При выходе курсора за пределы canvas тоже завершаем drag
    if (isDragging) {
      dispatch({ type: 'END_DRAG' })
      setIsDragging(false)
      setDragStartPos(null)
      draggedObject.current = null
    }
    isPanning.current = false
  }, [isDragging, dispatch])

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    
    // Если зажат Ctrl и рисуется стена - изменяем угол
    if (e.ctrlKey && state.activeTool === 'wall' && state.wallDrawingState.isDrawing) {
      WallTool.adjustAngle(e.deltaY)
      render()
      return
    }
    
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const screenPos: Point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }

    const delta = e.deltaY > 0 ? -0.1 : 0.1
    zoom(delta, screenPos)
  }, [zoom, state.activeTool, state.wallDrawingState.isDrawing, render])

  // Обработка клавиш Ctrl
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        setIsCtrlPressed(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        setIsCtrlPressed(false)
        // Сбрасываем угол при отпускании Ctrl
        if (state.activeTool === 'wall') {
          WallTool.resetAngle()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [state.activeTool])

  // Рендерим при изменении состояния
  useEffect(() => {
    render()
  }, [render])

  // Обработка изменения размера
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = width
    canvas.height = height
    render()
  }, [width, height, render])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
      style={{ 
        display: 'block',
        cursor: isDragging ? 'grabbing' : (state.activeTool === 'select' ? 'default' : 'crosshair')
      }}
    />
  )
}

