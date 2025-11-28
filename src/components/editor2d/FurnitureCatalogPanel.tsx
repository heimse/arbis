'use client'

import React, { useState } from 'react'
import { FurnitureTool } from './tools/FurnitureTool'
import { defaultFurnitureCatalog, getFurnitureByCategory } from '@/lib/editor/furnitureCatalog'
import type { FurnitureCategory } from '@/types/plan'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  Sofa, 
  Bed, 
  Package, 
  Table, 
  ChefHat, 
  Droplet, 
  Settings,
  Search
} from 'lucide-react'

interface FurnitureCatalogPanelProps {
  onItemSelect?: (catalogItemId: string) => void
}

const categoryIcons: Record<FurnitureCategory, React.ReactNode> = {
  seating: <Sofa size={20} />,
  sleeping: <Bed size={20} />,
  storage: <Package size={20} />,
  tables: <Table size={20} />,
  kitchen: <ChefHat size={20} />,
  bathroom: <Droplet size={20} />,
  technical: <Settings size={20} />,
  custom: <Package size={20} />,
}

const categoryLabels: Record<FurnitureCategory, string> = {
  seating: 'Сидячие места',
  sleeping: 'Кровати',
  storage: 'Хранение',
  tables: 'Столы',
  kitchen: 'Кухня',
  bathroom: 'Сантехника',
  technical: 'Оборудование',
  custom: 'Другое',
}

export function FurnitureCatalogPanel({ onItemSelect }: FurnitureCatalogPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<FurnitureCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Фильтруем каталог
  const filteredCatalog = React.useMemo(() => {
    let items = defaultFurnitureCatalog

    // Фильтр по категории
    if (selectedCategory !== 'all') {
      items = getFurnitureByCategory(selectedCategory)
    }

    // Фильтр по поиску
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
      )
    }

    return items
  }, [selectedCategory, searchQuery])

  const handleItemClick = (catalogItemId: string) => {
    FurnitureTool.setSelectedCatalogItem(catalogItemId)
    if (onItemSelect) {
      onItemSelect(catalogItemId)
    }
  }

  const handleCategoryClick = (category: FurnitureCategory | 'all') => {
    setSelectedCategory(category)
    // Сбрасываем выбор элемента при смене категории
    FurnitureTool.setSelectedCatalogItem(null)
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Поиск */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <Input
            type="text"
            placeholder="Поиск мебели..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Категории */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleCategoryClick('all')}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Все
          </button>
          {(Object.keys(categoryLabels) as FurnitureCategory[]).map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryClick(category)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors flex items-center gap-1.5 ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              title={categoryLabels[category]}
            >
              {categoryIcons[category]}
              <span className="hidden sm:inline">{categoryLabels[category]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Список мебели */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredCatalog.length === 0 ? (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
            Мебель не найдена
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredCatalog.map((item) => {
              const isSelected = FurnitureTool.getSelectedCatalogItem() === item.id
              return (
                <Card
                  key={item.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isSelected
                      ? 'ring-2 ring-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : ''
                  }`}
                  onClick={() => handleItemClick(item.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex flex-col items-center gap-2">
                      {/* Иконка */}
                      <div
                        className="w-12 h-12 rounded-md flex items-center justify-center"
                        style={{
                          backgroundColor: item.visualStyle.fillColor,
                          border: `2px solid ${item.visualStyle.strokeColor}`,
                        }}
                      >
                        <span className="text-2xl">
                          {getFurnitureIcon(item.name)}
                        </span>
                      </div>

                      {/* Название */}
                      <div className="text-xs font-medium text-center text-gray-700 dark:text-gray-300">
                        {item.name}
                      </div>

                      {/* Размеры */}
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {item.defaultSize.width}×{item.defaultSize.depth} мм
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Подсказка */}
      {FurnitureTool.getSelectedCatalogItem() && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
          <div className="text-xs text-blue-700 dark:text-blue-300">
            Выбран элемент. Кликните на план для размещения.
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Получает иконку для названия мебели
 */
function getFurnitureIcon(name: string): string {
  const nameLower = name.toLowerCase()
  if (nameLower.includes('кровать') || nameLower.includes('bed')) return '🛏️'
  if (nameLower.includes('диван') || nameLower.includes('sofa')) return '🛋️'
  if (nameLower.includes('стол') || nameLower.includes('table')) return '🪑'
  if (nameLower.includes('стул') || nameLower.includes('chair')) return '💺'
  if (nameLower.includes('кресло') || nameLower.includes('armchair')) return '🪑'
  if (nameLower.includes('шкаф') || nameLower.includes('wardrobe')) return '🚪'
  if (nameLower.includes('комод') || nameLower.includes('chest')) return '📦'
  if (nameLower.includes('тумбочка') || nameLower.includes('nightstand')) return '📦'
  if (nameLower.includes('холодильник') || nameLower.includes('refrigerator')) return '❄️'
  if (nameLower.includes('посудомойка') || nameLower.includes('dishwasher')) return '🍽️'
  if (nameLower.includes('унитаз') || nameLower.includes('toilet')) return '🚽'
  if (nameLower.includes('раковина') || nameLower.includes('sink')) return '🚿'
  if (nameLower.includes('ванна') || nameLower.includes('bathtub')) return '🛁'
  if (nameLower.includes('душ') || nameLower.includes('shower')) return '🚿'
  return '📦'
}
