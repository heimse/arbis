// Класс для рендеринга элементов на canvas

import type {
  Camera,
  GridSettings,
  Node,
  Wall,
  Door,
  Window,
  Room,
  Furniture,
  Dimension,
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

  /**
   * Рендерит процесс рисования размерной линии
   */
  /**
   * Рендерит выделение области для комнаты
   */
  renderRoomSelection(startPoint: Point, endPoint: Point) {
    const ctx = this.ctx

    const startScreen = worldToScreen(startPoint, this.camera)
    const endScreen = worldToScreen(endPoint, this.camera)

    const x = Math.min(startScreen.x, endScreen.x)
    const y = Math.min(startScreen.y, endScreen.y)
    const width = Math.abs(endScreen.x - startScreen.x)
    const height = Math.abs(endScreen.y - startScreen.y)

    // Полупрозрачный фон выделения
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'
    ctx.fillRect(x, y, width, height)

    // Обводка выделения
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.strokeRect(x, y, width, height)
    ctx.setLineDash([])
  }

  renderDimensionDrawing(startPoint: Point, endPoint: Point) {
    const ctx = this.ctx
    const start = worldToScreen(startPoint, this.camera)
    const end = worldToScreen(endPoint, this.camera)

    // Рисуем временную линию
    ctx.strokeStyle = '#6366f1'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])

    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.lineTo(end.x, end.y)
    ctx.stroke()

    ctx.setLineDash([])
  }

  /**
   * Рендерит комнаты (удалено - используется CanvasRenderer2D)
   * Старый метод удален, так как теперь используется новая логика с полигонами
   */
  /**
   * Рендерит комнаты
   */
  renderRooms(
    rooms: Map<string, Room>,
    layers: Map<string, Layer>,
    selection: Selection,
    isDragging: boolean = false
  ) {
    const ctx = this.ctx

    for (const room of rooms.values()) {
      const layer = layers.get(room.layerId)
      if (!layer || !layer.visible) continue

      const isSelected = selection.type === 'room' && selection.id === room.id

      // Полупрозрачность если перетаскиваем
      if (isSelected && isDragging) {
        ctx.globalAlpha = 0.7
      } else {
        ctx.globalAlpha = 1
      }

      // Если есть полигон, рендерим его, иначе используем прямоугольник
      if (room.polygon && room.polygon.length >= 3) {
        // Рендерим полигон
        ctx.beginPath()
        const firstPoint = worldToScreen(room.polygon[0], this.camera)
        ctx.moveTo(firstPoint.x, firstPoint.y)

        for (let i = 1; i < room.polygon.length; i++) {
          const point = worldToScreen(room.polygon[i], this.camera)
          ctx.lineTo(point.x, point.y)
        }
        ctx.closePath()

        // Фон комнаты (полупрозрачный для видимости)
        const fillColor = isSelected 
          ? 'rgba(59, 130, 246, 0.3)' // синий для выделенной
          : (this.isDark 
            ? 'rgba(30, 58, 138, 0.25)' // темно-синий для темной темы
            : 'rgba(219, 234, 254, 0.4)') // светло-синий для светлой темы
        
        ctx.fillStyle = fillColor
        ctx.fill()

        // Обводка комнаты
        const strokeColor = isSelected 
          ? '#2563eb' 
          : (this.isDark ? '#3b82f6' : '#60a5fa')
        ctx.strokeStyle = strokeColor
        ctx.lineWidth = isSelected ? 3 : 2
        ctx.stroke()

        // Рисуем название комнаты в центре полигона
        if (room.name) {
          // Вычисляем центр полигона
          let centerX = 0
          let centerY = 0
          const validPoints = room.polygon.filter((p, i) => i < room.polygon.length - 1) // исключаем последнюю точку если она дублирует первую
          for (const point of validPoints) {
            centerX += point.x
            centerY += point.y
          }
          centerX /= validPoints.length
          centerY /= validPoints.length

          const centerScreen = worldToScreen({ x: centerX, y: centerY }, this.camera)
          
          const fontSize = Math.max(12, Math.min(16, 14 * (this.camera.zoom / 50)))
          ctx.font = `bold ${fontSize}px sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          
          const text = room.name
          
          // Измеряем текст для фона
          const textMetrics = ctx.measureText(text)
          const textWidth = textMetrics.width
          const textHeight = fontSize
          const padding = 4
          
          // Рисуем фон для текста
          ctx.fillStyle = this.isDark 
            ? 'rgba(0, 0, 0, 0.7)' 
            : 'rgba(255, 255, 255, 0.9)'
          ctx.fillRect(
            centerScreen.x - textWidth / 2 - padding,
            centerScreen.y - textHeight / 2 - padding,
            textWidth + padding * 2,
            textHeight + padding * 2
          )
          
          // Рисуем текст
          ctx.fillStyle = this.isDark ? '#ffffff' : '#1f2937'
          ctx.fillText(text, centerScreen.x, centerScreen.y)
        }
      } else {
        // Рендерим как прямоугольник (старый способ для совместимости)
        const screenPos = worldToScreen(room.position, this.camera)
        const screenSize = {
          width: room.size.width * this.camera.zoom,
          height: room.size.height * this.camera.zoom,
        }

        // Пропускаем слишком маленькие комнаты
        if (screenSize.width < 10 || screenSize.height < 10) continue

        // Фон комнаты
        const fillColor = isSelected 
          ? 'rgba(59, 130, 246, 0.3)'
          : (this.isDark 
            ? 'rgba(30, 58, 138, 0.25)'
            : 'rgba(219, 234, 254, 0.4)')
        
        ctx.fillStyle = fillColor
        ctx.fillRect(screenPos.x, screenPos.y, screenSize.width, screenSize.height)

        // Обводка комнаты
        const strokeColor = isSelected 
          ? '#2563eb' 
          : (this.isDark ? '#3b82f6' : '#60a5fa')
        ctx.strokeStyle = strokeColor
        ctx.lineWidth = isSelected ? 3 : 2
        ctx.strokeRect(screenPos.x, screenPos.y, screenSize.width, screenSize.height)

        // Рисуем название комнаты
        if (room.name && screenSize.width > 30 && screenSize.height > 20) {
          const fontSize = Math.max(12, Math.min(16, 14 * (this.camera.zoom / 50)))
          ctx.font = `bold ${fontSize}px sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          
          const textX = screenPos.x + screenSize.width / 2
          const textY = screenPos.y + screenSize.height / 2
          const text = room.name
          
          const textMetrics = ctx.measureText(text)
          const textWidth = textMetrics.width
          const textHeight = fontSize
          const padding = 4
          
          ctx.fillStyle = this.isDark 
            ? 'rgba(0, 0, 0, 0.7)' 
            : 'rgba(255, 255, 255, 0.9)'
          ctx.fillRect(
            textX - textWidth / 2 - padding,
            textY - textHeight / 2 - padding,
            textWidth + padding * 2,
            textHeight + padding * 2
          )
          
          ctx.fillStyle = this.isDark ? '#ffffff' : '#1f2937'
          ctx.fillText(text, textX, textY)
        }
      }

      ctx.globalAlpha = 1
    }
  }

  /**
   * Рендерит мебель
   * TODO: Восстановить функционал инструмента мебель
   */
  renderFurniture(
    furniture: Map<string, Furniture>,
    layers: Map<string, Layer>,
    selection: Selection,
    isDragging: boolean = false
  ) {
    // TODO: Восстановить рендеринг мебели
  }

  /**
   * Рендерит размерные линии
   */
  renderDimensions(
    dimensions: Map<string, Dimension>,
    layers: Map<string, Layer>,
    selection: Selection,
    isDragging: boolean = false
  ) {
    const ctx = this.ctx

    for (const dimension of dimensions.values()) {
      const layer = layers.get(dimension.layerId)
      if (!layer || !layer.visible) continue

      const isSelected = selection.type === 'dimension' && selection.id === dimension.id
      const start = worldToScreen(dimension.startPoint, this.camera)
      const end = worldToScreen(dimension.endPoint, this.camera)

      // Полупрозрачность если перетаскиваем
      if (isSelected && isDragging) {
        ctx.globalAlpha = 0.7
      }

      ctx.strokeStyle = isSelected ? '#6366f1' : (this.isDark ? '#818cf8' : '#6366f1')
      ctx.lineWidth = isSelected ? 3 : 2

      // Рисуем основную линию
      ctx.beginPath()
      ctx.moveTo(start.x, start.y)
      ctx.lineTo(end.x, end.y)
      ctx.stroke()

      // Вычисляем длину для отображения
      const dx = dimension.endPoint.x - dimension.startPoint.x
      const dy = dimension.endPoint.y - dimension.startPoint.y
      const length = Math.sqrt(dx * dx + dy * dy)
      const text = dimension.text || `${length.toFixed(2)} м`

      const midX = (start.x + end.x) / 2
      const midY = (start.y + end.y) / 2

      // Фон для текста
      ctx.fillStyle = this.isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)'
      ctx.font = '11px sans-serif'
      const metrics = ctx.measureText(text)
      const padding = 4
      ctx.fillRect(
        midX - metrics.width / 2 - padding,
        midY - 8,
        metrics.width + padding * 2,
        16
      )

      // Текст
      ctx.fillStyle = this.isDark ? '#ffffff' : '#1f2937'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, midX, midY)

      ctx.globalAlpha = 1
    }
  }
}

