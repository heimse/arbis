// Класс для рендеринга элементов на canvas

import type {
  Camera,
  GridSettings,
  Node,
  Wall,
  Door,
  Window,
  Layer,
  Selection,
  Point,
  NodeId,
} from '@/types/editor'
import { worldToScreen, pointOnWall, angleBetween } from '@/lib/editor/geometry'

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D
  private camera: Camera
  private width: number
  private height: number
  private isDark: boolean

  constructor(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    width: number,
    height: number
  ) {
    this.ctx = ctx
    this.camera = camera
    this.width = width
    this.height = height
    this.isDark = document.documentElement.classList.contains('dark')
  }

  /**
   * Рендерит сетку
   */
  renderGrid(settings: GridSettings) {
    const ctx = this.ctx
    const spacing = settings.spacing * this.camera.zoom

    // Вычисляем видимую область в мировых координатах
    const topLeft = {
      x: this.camera.x,
      y: this.camera.y,
    }

    const bottomRight = {
      x: this.camera.x + this.width / this.camera.zoom,
      y: this.camera.y + this.height / this.camera.zoom,
    }

    // Начальные координаты для сетки
    const startX = Math.floor(topLeft.x / settings.spacing) * settings.spacing
    const startY = Math.floor(topLeft.y / settings.spacing) * settings.spacing

    // Рисуем вертикальные линии
    const gridColor = this.isDark ? '#1f2937' : settings.color
    const majorGridColor = this.isDark ? '#374151' : settings.majorColor
    
    ctx.strokeStyle = gridColor
    ctx.lineWidth = 0.5

    for (
      let x = startX;
      x <= bottomRight.x;
      x += settings.spacing
    ) {
      const screenX = (x - this.camera.x) * this.camera.zoom
      
      // Каждую N-ую линию делаем жирнее
      const isMajor = Math.round(x / settings.spacing) % settings.subdivisions === 0
      
      if (isMajor) {
        ctx.strokeStyle = majorGridColor
        ctx.lineWidth = 1
      } else {
        ctx.strokeStyle = gridColor
        ctx.lineWidth = 0.5
      }

      ctx.beginPath()
      ctx.moveTo(screenX, 0)
      ctx.lineTo(screenX, this.height)
      ctx.stroke()
    }

    // Рисуем горизонтальные линии
    for (
      let y = startY;
      y <= bottomRight.y;
      y += settings.spacing
    ) {
      const screenY = (y - this.camera.y) * this.camera.zoom

      const isMajor = Math.round(y / settings.spacing) % settings.subdivisions === 0
      
      if (isMajor) {
        ctx.strokeStyle = majorGridColor
        ctx.lineWidth = 1
      } else {
        ctx.strokeStyle = gridColor
        ctx.lineWidth = 0.5
      }

      ctx.beginPath()
      ctx.moveTo(0, screenY)
      ctx.lineTo(this.width, screenY)
      ctx.stroke()
    }
  }


  /**
   * Рендерит стены
   */
  renderWalls(
    walls: Map<string, Wall>,
    nodes: Map<string, Node>,
    layers: Map<string, Layer>,
    selection: Selection,
    isDragging: boolean = false
  ) {
    const ctx = this.ctx

    for (const wall of walls.values()) {
      const layer = layers.get(wall.layerId)
      if (!layer || !layer.visible) continue

      const startNode = nodes.get(wall.startNodeId)
      const endNode = nodes.get(wall.endNodeId)

      if (!startNode || !endNode) continue

      const start = worldToScreen(startNode, this.camera)
      const end = worldToScreen(endNode, this.camera)

      // Выделение
      const isSelected = selection.type === 'wall' && selection.id === wall.id

      // Вычисляем перпендикулярное направление для отрисовки толщины
      const angle = Math.atan2(end.y - start.y, end.x - start.x)
      const perpAngle = angle + Math.PI / 2
      
      const thickness = (wall.thickness / 1000) * this.camera.zoom // из мм в метры, затем в пиксели
      const halfThickness = thickness / 2

      const dx = Math.cos(perpAngle) * halfThickness
      const dy = Math.sin(perpAngle) * halfThickness

      // Полупрозрачность если перетаскиваем
      if (isSelected && isDragging) {
        ctx.globalAlpha = 0.7
      }

      // Рисуем стену как прямоугольник
      const wallColor = this.isDark ? '#374151' : layer.color
      ctx.fillStyle = isSelected ? '#3b82f6' : wallColor
      ctx.strokeStyle = isSelected ? '#1d4ed8' : (this.isDark ? '#4b5563' : '#000000')
      ctx.lineWidth = isSelected ? 3 : 1

      ctx.beginPath()
      ctx.moveTo(start.x + dx, start.y + dy)
      ctx.lineTo(end.x + dx, end.y + dy)
      ctx.lineTo(end.x - dx, end.y - dy)
      ctx.lineTo(start.x - dx, start.y - dy)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      // Показываем маркеры для перемещения при выделении
      if (isSelected && !isDragging) {
        // Маркеры на концах стены
        ctx.fillStyle = '#3b82f6'
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        
        const markerSize = 6
        // Начало стены
        ctx.beginPath()
        ctx.arc(start.x, start.y, markerSize, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
        
        // Конец стены
        ctx.beginPath()
        ctx.arc(end.x, end.y, markerSize, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
      }

      ctx.globalAlpha = 1

      // Отображение длины стены (если zoom достаточный)
      if (this.camera.zoom > 30) {
        const length = Math.sqrt(
          Math.pow(endNode.x - startNode.x, 2) +
          Math.pow(endNode.y - startNode.y, 2)
        )
        
        const midX = (start.x + end.x) / 2
        const midY = (start.y + end.y) / 2

        ctx.fillStyle = this.isDark ? '#9ca3af' : '#374151'
        ctx.font = '11px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(`${length.toFixed(2)} м`, midX, midY)
      }
    }
  }

  /**
   * Рендерит двери
   */
  renderDoors(
    doors: Map<string, Door>,
    walls: Map<string, Wall>,
    nodes: Map<string, Node>,
    layers: Map<string, Layer>,
    selection: Selection,
    isDragging: boolean = false
  ) {
    const ctx = this.ctx

    for (const door of doors.values()) {
      const layer = layers.get(door.layerId)
      if (!layer || !layer.visible) continue

      const wall = walls.get(door.wallId)
      if (!wall) continue

      const startNode = nodes.get(wall.startNodeId)
      const endNode = nodes.get(wall.endNodeId)
      if (!startNode || !endNode) continue

      // Позиция двери на стене
      const doorWorldPos = pointOnWall(wall, door.position, nodes)
      if (!doorWorldPos) continue

      const doorScreenPos = worldToScreen(doorWorldPos, this.camera)
      const isSelected = selection.type === 'door' && selection.id === door.id

      // Полупрозрачность если перетаскиваем
      if (isSelected && isDragging) {
        ctx.globalAlpha = 0.7
      }

      // Вычисляем направление стены
      const wallAngle = angleBetween(startNode, endNode)
      
      // Рисуем прямоугольник двери
      const doorWidth = (door.width / 1000) * this.camera.zoom
      const doorThickness = 0.05 * this.camera.zoom // 5см

      ctx.save()
      ctx.translate(doorScreenPos.x, doorScreenPos.y)
      ctx.rotate(wallAngle)

      // Проём
      ctx.fillStyle = this.isDark ? '#1f2937' : '#ffffff'
      ctx.fillRect(-doorWidth / 2, -doorThickness / 2, doorWidth, doorThickness)

      // Контур двери
      ctx.strokeStyle = isSelected ? '#3b82f6' : (this.isDark ? '#9ca3af' : '#1f2937')
      ctx.lineWidth = isSelected ? 3 : 2
      ctx.strokeRect(-doorWidth / 2, -doorThickness / 2, doorWidth, doorThickness)

      // Дуга открывания
      ctx.strokeStyle = isSelected ? '#3b82f6' : (this.isDark ? '#6b7280' : '#6b7280')
      ctx.lineWidth = 1
      ctx.beginPath()
      
      const openDirection = door.openDirection === 'right' ? 1 : -1
      ctx.arc(
        openDirection * (doorWidth / 2),
        0,
        doorWidth,
        openDirection === 1 ? Math.PI : 0,
        openDirection === 1 ? Math.PI * 1.5 : Math.PI * 0.5
      )
      ctx.stroke()

      ctx.restore()
      ctx.globalAlpha = 1
    }
  }

  /**
   * Рендерит окна
   */
  renderWindows(
    windows: Map<string, Window>,
    walls: Map<string, Wall>,
    nodes: Map<string, Node>,
    layers: Map<string, Layer>,
    selection: Selection,
    isDragging: boolean = false
  ) {
    const ctx = this.ctx

    for (const window of windows.values()) {
      const layer = layers.get(window.layerId)
      if (!layer || !layer.visible) continue

      const wall = walls.get(window.wallId)
      if (!wall) continue

      const startNode = nodes.get(wall.startNodeId)
      const endNode = nodes.get(wall.endNodeId)
      if (!startNode || !endNode) continue

      // Позиция окна на стене
      const windowWorldPos = pointOnWall(wall, window.position, nodes)
      if (!windowWorldPos) continue

      const windowScreenPos = worldToScreen(windowWorldPos, this.camera)
      const isSelected = selection.type === 'window' && selection.id === window.id

      // Полупрозрачность если перетаскиваем
      if (isSelected && isDragging) {
        ctx.globalAlpha = 0.7
      }

      // Вычисляем направление стены
      const wallAngle = angleBetween(startNode, endNode)
      
      // Рисуем окно
      const windowWidth = (window.width / 1000) * this.camera.zoom
      const windowThickness = 0.1 * this.camera.zoom

      ctx.save()
      ctx.translate(windowScreenPos.x, windowScreenPos.y)
      ctx.rotate(wallAngle)

      // Проём окна
      ctx.fillStyle = this.isDark ? '#0c4a6e' : '#e0f2fe'
      ctx.fillRect(-windowWidth / 2, -windowThickness / 2, windowWidth, windowThickness)

      // Контур
      ctx.strokeStyle = isSelected ? '#3b82f6' : (this.isDark ? '#0ea5e9' : '#0ea5e9')
      ctx.lineWidth = isSelected ? 3 : 2
      ctx.strokeRect(-windowWidth / 2, -windowThickness / 2, windowWidth, windowThickness)

      // Разделитель (имитация рамы)
      ctx.strokeStyle = isSelected ? '#3b82f6' : (this.isDark ? '#38bdf8' : '#0284c7')
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, -windowThickness / 2)
      ctx.lineTo(0, windowThickness / 2)
      ctx.stroke()

      ctx.restore()
      ctx.globalAlpha = 1
    }
  }

  /**
   * Рендерит узлы
   */
  renderNodes(nodes: Map<string, Node>, selection: Selection, isDragging: boolean = false) {
    const ctx = this.ctx

    for (const node of nodes.values()) {
      const screenPos = worldToScreen(node, this.camera)
      const isSelected = selection.type === 'node' && selection.id === node.id

      const radius = isSelected ? 6 : 4

      // Полупрозрачность если перетаскиваем
      if (isSelected && isDragging) {
        ctx.globalAlpha = 0.7
      }

      ctx.fillStyle = isSelected ? '#3b82f6' : (this.isDark ? '#9ca3af' : '#1f2937')
      ctx.strokeStyle = this.isDark ? '#0a0a0a' : '#ffffff'
      ctx.lineWidth = 2

      ctx.beginPath()
      ctx.arc(screenPos.x, screenPos.y, radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      // Курсор grab при hover
      if (isSelected && !isDragging) {
        // Рисуем иконку перемещения
        ctx.strokeStyle = '#3b82f6'
        ctx.lineWidth = 1.5
        const size = 3
        
        // Крестик
        ctx.beginPath()
        ctx.moveTo(screenPos.x - size - 8, screenPos.y)
        ctx.lineTo(screenPos.x + size + 8, screenPos.y)
        ctx.moveTo(screenPos.x, screenPos.y - size - 8)
        ctx.lineTo(screenPos.x, screenPos.y + size + 8)
        ctx.stroke()
      }

      ctx.globalAlpha = 1
    }
  }

  /**
   * Рендерит процесс рисования стены
   */
  renderWallDrawing(
    nodeIds: NodeId[],
    nodes: Map<string, Node>,
    currentMousePos: Point
  ) {
    if (nodeIds.length === 0) return

    const ctx = this.ctx

    // Рисуем уже созданные сегменты
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 3
    ctx.setLineDash([5, 5])

    for (let i = 0; i < nodeIds.length - 1; i++) {
      const node1 = nodes.get(nodeIds[i])
      const node2 = nodes.get(nodeIds[i + 1])

      if (!node1 || !node2) continue

      const start = worldToScreen(node1, this.camera)
      const end = worldToScreen(node2, this.camera)

      ctx.beginPath()
      ctx.moveTo(start.x, start.y)
      ctx.lineTo(end.x, end.y)
      ctx.stroke()
    }

    // Рисуем линию от последнего узла до курсора (текущая стена)
    const lastNode = nodes.get(nodeIds[nodeIds.length - 1])
    if (lastNode) {
      const start = worldToScreen(lastNode, this.camera)
      const end = worldToScreen(currentMousePos, this.camera)

      // Основная линия
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 4
      ctx.setLineDash([])
      ctx.beginPath()
      ctx.moveTo(start.x, start.y)
      ctx.lineTo(end.x, end.y)
      ctx.stroke()

      // Рисуем направляющие линии для ортогональных направлений
      this.renderGuideLines(lastNode, currentMousePos)

      // Отображаем длину
      const length = Math.sqrt(
        Math.pow(currentMousePos.x - lastNode.x, 2) +
        Math.pow(currentMousePos.y - lastNode.y, 2)
      )
      
      const midX = (start.x + end.x) / 2
      const midY = (start.y + end.y) / 2

      // Фон для текста
      ctx.fillStyle = this.isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)'
      ctx.strokeStyle = this.isDark ? '#3b82f6' : '#2563eb'
      ctx.lineWidth = 1
      
      const text = `${length.toFixed(2)} м`
      const metrics = ctx.measureText(text)
      const padding = 6
      
      ctx.fillRect(
        midX - metrics.width / 2 - padding,
        midY - 10,
        metrics.width + padding * 2,
        20
      )
      ctx.strokeRect(
        midX - metrics.width / 2 - padding,
        midY - 10,
        metrics.width + padding * 2,
        20
      )

      // Текст длины
      ctx.fillStyle = this.isDark ? '#ffffff' : '#1f2937'
      ctx.font = 'bold 12px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, midX, midY)
    }

    ctx.setLineDash([])
  }

  /**
   * Рисует направляющие линии для ортогональных направлений
   */
  private renderGuideLines(fromNode: Point, toPos: Point) {
    const ctx = this.ctx
    const start = worldToScreen(fromNode, this.camera)
    
    // Тонкие направляющие линии для 4 основных направлений
    ctx.strokeStyle = this.isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])

    const guideLength = 200 // длина направляющей в пикселях

    // Горизонталь (0°)
    ctx.beginPath()
    ctx.moveTo(start.x - guideLength, start.y)
    ctx.lineTo(start.x + guideLength, start.y)
    ctx.stroke()

    // Вертикаль (90°)
    ctx.beginPath()
    ctx.moveTo(start.x, start.y - guideLength)
    ctx.lineTo(start.x, start.y + guideLength)
    ctx.stroke()

    ctx.setLineDash([])
  }

  /**
   * Рендерит индикатор snap
   */
  renderSnapIndicator(position: Point) {
    const screenPos = worldToScreen(position, this.camera)
    const ctx = this.ctx

    ctx.strokeStyle = '#10b981'
    ctx.lineWidth = 2
    const size = 8

    ctx.beginPath()
    ctx.moveTo(screenPos.x - size, screenPos.y)
    ctx.lineTo(screenPos.x + size, screenPos.y)
    ctx.moveTo(screenPos.x, screenPos.y - size)
    ctx.lineTo(screenPos.x, screenPos.y + size)
    ctx.stroke()
  }
}

