"use client";

import * as React from "react";
import {
	Pointer,
	Square,
	Armchair,
	ZoomIn,
	ZoomOut,
	Trash2,
	Image,
	Eye,
	EyeOff,
	Maximize2,
	Minimize2,
	PanelRightClose,
	PanelRightOpen,
	PanelLeftClose,
	PanelLeftOpen,
	Minus,
	DoorOpen,
	RectangleHorizontal,
	Ruler,
	Undo,
	Redo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditor2DStore } from "@/store/editor2dStore";
import type { EditorTool } from "@/store/editor2dStore";

/**
 * Пропсы для панели инструментов
 */
export type Editor2DToolbarProps = {
	onToggleFullscreen?: () => void;
	isFullscreen?: boolean;
	onToggleRightPanel?: () => void;
	isRightPanelVisible?: boolean;
	onToggleLeftPanel?: () => void;
	isLeftPanelVisible?: boolean;
};

/**
 * Панель инструментов для 2D-редактора
 */
export function Editor2DToolbar({
	onToggleFullscreen,
	isFullscreen,
	onToggleRightPanel,
	isRightPanelVisible,
	onToggleLeftPanel,
	isLeftPanelVisible,
}: Editor2DToolbarProps) {
	const {
		tool,
		zoom,
		selectedId,
		plan,
		wallDrawing,
		dimensionDrawing,
		history,
		historyIndex,
		setTool,
		setZoom,
		deleteSelected,
		toggleBackgroundVisibility,
		undo,
		redo,
		finishWallDrawing,
		cancelWallDrawing,
		cancelDimensionDrawing,
	} = useEditor2DStore();

	// Вычисляем состояние undo/redo реактивно
	const canUndo = historyIndex > 0;
	const canRedo = historyIndex < history.length - 1;

	const backgroundImage = plan.backgroundImage;

	const handleZoomIn = () => {
		setZoom(zoom * 1.2);
	};

	const handleZoomOut = () => {
		setZoom(zoom / 1.2);
	};

	const handleZoomReset = () => {
		setZoom(1);
	};

	const handleDelete = () => {
		if (selectedId) {
			deleteSelected();
		}
	};

	const tools: Array<{
		id: EditorTool;
		label: string;
		icon: React.ReactNode;
	}> = [
		{
			id: "select",
			label: "Выделение",
			icon: <Pointer className="h-4 w-4" />,
		},
		{
			id: "wall",
			label: "Стена",
			icon: <Minus className="h-4 w-4" />,
		},
		{
			id: "door",
			label: "Дверь",
			icon: <DoorOpen className="h-4 w-4" />,
		},
		{
			id: "window",
			label: "Окно",
			icon: <RectangleHorizontal className="h-4 w-4" />,
		},
		{
			id: "dimension",
			label: "Размеры",
			icon: <Ruler className="h-4 w-4" />,
		},
		{
			id: "room",
			label: "Комната",
			icon: <Square className="h-4 w-4" />,
		},
		{
			id: "furniture",
			label: "Мебель",
			icon: <Armchair className="h-4 w-4" />,
		},
	];

	// Обработка горячих клавиш
	React.useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Escape - отмена рисования стены или размерной линии
			if (e.key === "Escape") {
				if (wallDrawing.active) {
					cancelWallDrawing();
					return;
				}
				if (dimensionDrawing.active) {
					cancelDimensionDrawing();
					return;
				}
			}

			// Ctrl+Z - Undo
			if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
				e.preventDefault();
				if (canUndo) {
					undo();
				}
				return;
			}

			// Ctrl+Y или Ctrl+Shift+Z - Redo
			if (
				((e.ctrlKey || e.metaKey) && e.key === "y") ||
				((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z")
			) {
				e.preventDefault();
				if (canRedo) {
					redo();
				}
				return;
			}

			// Delete - удалить выбранный объект
			if (e.key === "Delete" && selectedId) {
				e.preventDefault();
				deleteSelected();
				return;
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [
		wallDrawing.active,
		dimensionDrawing.active,
		canUndo,
		canRedo,
		selectedId,
		cancelWallDrawing,
		cancelDimensionDrawing,
		undo,
		redo,
		deleteSelected,
	]);

	return (
		<>
			{/* Плавающая панель инструментов по центру внизу (стиль Figma) */}
			<div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
				<div className="flex items-center gap-2 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg px-3 py-2 pointer-events-auto">
					{/* Undo/Redo */}
					<Button
						variant="ghost"
						size="sm"
						onClick={() => undo()}
						disabled={!canUndo}
						title="Отменить (Ctrl+Z)"
						className="h-9 w-9 p-0"
					>
						<Undo className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => redo()}
						disabled={!canRedo}
						title="Повторить (Ctrl+Y)"
						className="h-9 w-9 p-0"
					>
						<Redo className="h-4 w-4" />
					</Button>

					<div className="h-6 w-px bg-border mx-1" />

					{/* Инструменты */}
					{tools.map((t) => (
						<Button
							key={t.id}
							variant={tool === t.id ? "default" : "ghost"}
							size="sm"
							onClick={() => {
								if (tool === "wall" && wallDrawing.active) {
									finishWallDrawing();
								}
								if (tool === "dimension" && dimensionDrawing.active) {
									cancelDimensionDrawing();
								}
								setTool(t.id);
							}}
							title={t.label}
							className="h-9 w-9 p-0"
						>
							{t.icon}
						</Button>
					))}

					<div className="h-6 w-px bg-border mx-1" />

					{/* Кнопка удаления */}
					<Button
						variant="ghost"
						size="sm"
						onClick={handleDelete}
						disabled={!selectedId}
						title="Удалить (Delete)"
						className="h-9 w-9 p-0"
					>
						<Trash2 className="h-4 w-4" />
					</Button>

					{/* Фоновое изображение */}
					{backgroundImage && (
						<>
							<div className="h-6 w-px bg-border mx-1" />
							<Button
								variant="ghost"
								size="sm"
								onClick={toggleBackgroundVisibility}
								title={backgroundImage.visible ? "Скрыть фон" : "Показать фон"}
								className="h-9 w-9 p-0"
							>
								{backgroundImage.visible ? (
									<Eye className="h-4 w-4" />
								) : (
									<EyeOff className="h-4 w-4" />
								)}
							</Button>
						</>
					)}

					<div className="h-6 w-px bg-border mx-1" />

					{/* Масштаб */}
					<Button
						variant="ghost"
						size="sm"
						onClick={handleZoomOut}
						title="Уменьшить"
						className="h-9 w-9 p-0"
					>
						<ZoomOut className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={handleZoomReset}
						title="Сбросить масштаб"
						className="h-9 min-w-[3.5rem] px-2 text-xs font-medium"
					>
						{Math.round(zoom * 100)}%
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={handleZoomIn}
						title="Увеличить"
						className="h-9 w-9 p-0"
					>
						<ZoomIn className="h-4 w-4" />
					</Button>
				</div>

				{/* Статус рисования стены */}
				{wallDrawing.active && (
					<div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-lg text-sm font-medium whitespace-nowrap">
						Кликайте для добавления стен • Двойной клик для завершения • ESC для
						отмены
					</div>
				)}
				{/* Статус рисования размерной линии */}
				{dimensionDrawing.active && (
					<div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-lg text-sm font-medium whitespace-nowrap">
						Клик для завершения размерной линии • ESC для отмены
					</div>
				)}
			</div>

			{/* Левый верхний угол - управление левой панелью */}
			{onToggleLeftPanel && (
				<div className="absolute top-4 left-4 z-40 pointer-events-none">
					<div className="flex items-center gap-2 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg px-2 py-2 pointer-events-auto">
						<Button
							variant="ghost"
							size="sm"
							onClick={onToggleLeftPanel}
							title={
								isLeftPanelVisible ? "Скрыть навигацию" : "Показать навигацию"
							}
							className="h-9 w-9 p-0"
						>
							{isLeftPanelVisible ? (
								<PanelLeftClose className="h-4 w-4" />
							) : (
								<PanelLeftOpen className="h-4 w-4" />
							)}
						</Button>
					</div>
				</div>
			)}

			{/* Правый верхний угол - управление панелями и fullscreen */}
			{(onToggleRightPanel || onToggleFullscreen) && (
				<div className="absolute top-4 right-4 z-40 pointer-events-none">
					<div className="flex items-center gap-2 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg px-2 py-2 pointer-events-auto">
						{/* Скрыть/показать правую панель */}
						{onToggleRightPanel && (
							<Button
								variant="ghost"
								size="sm"
								onClick={onToggleRightPanel}
								title={
									isRightPanelVisible
										? "Скрыть панель свойств"
										: "Показать панель свойств"
								}
								className="h-9 w-9 p-0"
							>
								{isRightPanelVisible ? (
									<PanelRightClose className="h-4 w-4" />
								) : (
									<PanelRightOpen className="h-4 w-4" />
								)}
							</Button>
						)}

						{/* Fullscreen */}
						{onToggleFullscreen && (
							<Button
								variant="ghost"
								size="sm"
								onClick={onToggleFullscreen}
								title={
									isFullscreen ? "Выйти из полного экрана" : "Полный экран"
								}
								className="h-9 w-9 p-0"
							>
								{isFullscreen ? (
									<Minimize2 className="h-4 w-4" />
								) : (
									<Maximize2 className="h-4 w-4" />
								)}
							</Button>
						)}
					</div>
				</div>
			)}
		</>
	);
}
