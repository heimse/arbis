"use client";

import React from "react";
import { Eye, Hammer, ShoppingCart } from "lucide-react";

export type ViewMode = "view" | "build" | "buy";

interface ModeSelectorProps {
	mode: ViewMode;
	onModeChange: (mode: ViewMode) => void;
}

/**
 * Панель переключения режимов 3D редактора
 */
export function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
	const modes: Array<{ id: ViewMode; label: string; icon: React.ReactNode }> = [
		{
			id: "view",
			label: "Просмотр",
			icon: <Eye size={18} />,
		},
		{
			id: "build",
			label: "Строительство",
			icon: <Hammer size={18} />,
		},
		{
			id: "buy",
			label: "Мебель",
			icon: <ShoppingCart size={18} />,
		},
	];

	return (
		<div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
			<div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1">
				{modes.map((m) => (
					<button
						key={m.id}
						onClick={() => onModeChange(m.id)}
						className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
							mode === m.id
								? "bg-blue-600 text-white shadow-sm"
								: "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
						}`}
						title={m.label}
					>
						{m.icon}
						<span className="text-sm font-medium">{m.label}</span>
					</button>
				))}
			</div>
		</div>
	);
}
