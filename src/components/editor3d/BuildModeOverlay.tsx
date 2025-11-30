"use client";

import React from "react";

interface BuildModeOverlayProps {
	hoveredPoint: { x: number; y: number; z: number } | null;
}

/**
 * Оверлей для режима Build
 * Показывает подсказки и информацию о режиме строительства
 */
export function BuildModeOverlay({ hoveredPoint }: BuildModeOverlayProps) {
	return (
		<div className="absolute bottom-4 left-4 z-10">
			<div className="px-4 py-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
				<div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
					Режим строительства
				</div>
				<div className="text-xs text-gray-600 dark:text-gray-400">
					Здесь будут инструменты для создания стен, полов и проёмов
				</div>
				{hoveredPoint && (
					<div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
						Позиция: ({hoveredPoint.x.toFixed(2)}, {hoveredPoint.z.toFixed(2)})
					</div>
				)}
			</div>
		</div>
	);
}
