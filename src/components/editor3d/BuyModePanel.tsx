"use client";

import React, { useState } from "react";
import { X, ChevronLeft } from "lucide-react";
import {
	FURNITURE_CATALOG,
	FURNITURE_CATEGORIES,
	getFurnitureByCategory,
	type FurnitureCatalogItem,
} from "./furnitureCatalog";

interface BuyModePanelProps {
	onClose?: () => void;
	selectedFurnitureId: string | null;
	onFurnitureSelect: (furniture: FurnitureCatalogItem | null) => void;
}

/**
 * Панель каталога мебели для режима Buy
 */
export function BuyModePanel({
	onClose,
	selectedFurnitureId,
	onFurnitureSelect,
}: BuyModePanelProps) {
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

	const furnitureInCategory = selectedCategory
		? getFurnitureByCategory(selectedCategory)
		: [];

	const handleCategoryClick = (category: string) => {
		setSelectedCategory(category);
	};

	const handleFurnitureClick = (furniture: FurnitureCatalogItem) => {
		onFurnitureSelect(furniture);
	};

	const handleBack = () => {
		setSelectedCategory(null);
		onFurnitureSelect(null);
	};

	return (
		<div className="absolute right-4 top-4 bottom-4 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-10 flex flex-col">
			{/* Заголовок */}
			<div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
				<div className="flex items-center gap-2">
					{selectedCategory && (
						<button
							onClick={handleBack}
							className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
							title="Назад"
						>
							<ChevronLeft size={18} />
						</button>
					)}
					<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
						{selectedCategory || "Каталог мебели"}
					</h3>
				</div>
				{onClose && (
					<button
						onClick={onClose}
						className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
						title="Закрыть"
					>
						<X size={18} />
					</button>
				)}
			</div>

			{/* Контент */}
			<div className="flex-1 overflow-y-auto p-4">
				{!selectedCategory ? (
					// Список категорий
					<div className="space-y-2">
						{FURNITURE_CATEGORIES.map((category) => {
							const count = getFurnitureByCategory(category).length;
							if (count === 0) return null;

							return (
								<button
									key={category}
									onClick={() => handleCategoryClick(category)}
									className="w-full text-left px-4 py-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
								>
									<div className="font-medium text-gray-900 dark:text-gray-100">
										{category}
									</div>
									<div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
										{count} {count === 1 ? "предмет" : "предметов"}
									</div>
								</button>
							);
						})}
					</div>
				) : (
					// Список мебели в категории
					<div className="space-y-2">
						{furnitureInCategory.map((furniture) => (
							<button
								key={furniture.id}
								onClick={() => handleFurnitureClick(furniture)}
								className={`w-full text-left px-4 py-3 rounded-md transition-colors border ${
									selectedFurnitureId === furniture.id
										? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-500"
										: "border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
								}`}
							>
								<div
									className={`font-medium ${
										selectedFurnitureId === furniture.id
											? "text-blue-700 dark:text-blue-300"
											: "text-gray-900 dark:text-gray-100"
									}`}
								>
									{furniture.name}
								</div>
								<div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
									{furniture.defaultSize.width.toFixed(1)} ×{" "}
									{furniture.defaultSize.depth.toFixed(1)} ×{" "}
									{furniture.defaultSize.height.toFixed(1)} м
								</div>
							</button>
						))}
					</div>
				)}
			</div>

			{/* Подсказка */}
			<div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
				{selectedFurnitureId ? (
					<div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
						Выбрано:{" "}
						{FURNITURE_CATALOG.find((f) => f.id === selectedFurnitureId)?.name}
						<br />
						<span className="text-gray-500 dark:text-gray-400">
							Кликните на пол для размещения
						</span>
					</div>
				) : (
					<div className="text-xs text-gray-500 dark:text-gray-400">
						Выберите категорию и предмет мебели для размещения
					</div>
				)}
			</div>
		</div>
	);
}
