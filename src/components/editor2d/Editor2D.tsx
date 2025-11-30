"use client";

import React, { useState, useEffect, useRef } from "react";
import { EditorProvider, useEditor } from "@/store/editorStore";
import { Canvas } from "./Canvas";
import { Toolbar } from "./Toolbar";
import { RightPanel } from "./RightPanel";
import { KeyboardHandler } from "./KeyboardHandler";
import { HistoryIndicator } from "./HistoryIndicator";
import { EditableProjectName } from "./EditableProjectName";
import { Plan3DViewer } from "@/components/editor3d";
import { ChatWidget } from "./ChatWidget";
import {
	Save,
	Maximize2,
	Menu,
	Download,
	Upload,
	CheckCircle2,
	Loader2,
	Box,
	Grid2X2,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { EditorState } from "@/types/editor";
import { useAutoSave } from "@/hooks/useAutoSave";

interface Editor2DProps {
	projectId: string;
	projectName?: string;
}

interface EditorContentProps {
	projectId: string;
	projectName: string;
}

function EditorContent({
	projectId,
	projectName = "Без названия",
}: EditorContentProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
	const [currentProjectName, setCurrentProjectName] = useState(projectName);
	const [isSaving, setIsSaving] = useState(false);
	const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
		"idle"
	);
	const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
	const { state, dispatch } = useEditor();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isLoadingPlan, setIsLoadingPlan] = useState(true);

	// Загрузка данных проекта при открытии
	useEffect(() => {
		const loadProjectPlan = async () => {
			try {
				setIsLoadingPlan(true);
				const response = await fetch(`/api/projects/${projectId}/plan`);

				if (!response.ok) {
					throw new Error("Failed to load plan");
				}

				const data = await response.json();

				if (data.planData) {
					// Преобразуем данные из формата базы данных в формат editorStore
					const planData = data.planData;

					// Конвертируем base64 data URLs обратно в blob URLs
					const { convertBase64ToBlobUrls } = await import(
						"@/lib/editor/textureUtils"
					);
					const planDataWithBlobUrls = convertBase64ToBlobUrls(
						planData
					) as typeof planData;

					console.log("Загрузка плана:", {
						nodes: planDataWithBlobUrls.nodes?.length || 0,
						walls: planDataWithBlobUrls.walls?.length || 0,
						doors: planDataWithBlobUrls.doors?.length || 0,
						windows: planDataWithBlobUrls.windows?.length || 0,
						rooms: planDataWithBlobUrls.rooms?.length || 0,
						furniture: planDataWithBlobUrls.furniture?.length || 0,
						dimensions: planDataWithBlobUrls.dimensions?.length || 0,
					});

					// Очищаем текущее состояние
					dispatch({ type: "CLEAR_ALL" });

					// Небольшая задержка для обновления состояния после CLEAR_ALL
					await new Promise((resolve) => setTimeout(resolve, 10));

					// Импортируем слои
					if (Array.isArray(planDataWithBlobUrls.layers)) {
						planDataWithBlobUrls.layers.forEach((layer: any) => {
							dispatch({ type: "UPDATE_LAYER", id: layer.id, updates: layer });
						});
					}

					// Импортируем узлы (должны быть первыми, так как стены ссылаются на них)
					if (Array.isArray(planDataWithBlobUrls.nodes)) {
						planDataWithBlobUrls.nodes.forEach((node: any) => {
							dispatch({ type: "ADD_NODE", node });
						});
					}

					// Импортируем стены (после узлов)
					if (Array.isArray(planDataWithBlobUrls.walls)) {
						planDataWithBlobUrls.walls.forEach((wall: any) => {
							dispatch({ type: "ADD_WALL", wall });
						});
					}

					// Импортируем двери (после стен)
					if (Array.isArray(planDataWithBlobUrls.doors)) {
						planDataWithBlobUrls.doors.forEach((door: any) => {
							dispatch({ type: "ADD_DOOR", door });
						});
					}

					// Импортируем окна (после стен)
					if (Array.isArray(planDataWithBlobUrls.windows)) {
						planDataWithBlobUrls.windows.forEach((window: any) => {
							dispatch({ type: "ADD_WINDOW", window });
						});
					}

					// Импортируем комнаты
					if (Array.isArray(planDataWithBlobUrls.rooms)) {
						planDataWithBlobUrls.rooms.forEach((room: any) => {
							dispatch({ type: "ADD_ROOM", room });
						});
					}

					// Импортируем мебель
					if (Array.isArray(planDataWithBlobUrls.furniture)) {
						planDataWithBlobUrls.furniture.forEach((furniture: any) => {
							dispatch({ type: "ADD_FURNITURE", furniture });
						});
					}

					// Импортируем размерные линии
					if (Array.isArray(planDataWithBlobUrls.dimensions)) {
						planDataWithBlobUrls.dimensions.forEach((dimension: any) => {
							dispatch({ type: "ADD_DIMENSION", dimension });
						});
					}

					// Импортируем камеру
					if (planDataWithBlobUrls.camera) {
						dispatch({
							type: "SET_CAMERA",
							camera: planDataWithBlobUrls.camera,
						});
					}

					// Импортируем фоновое изображение
					if (planDataWithBlobUrls.backgroundImage !== undefined) {
						dispatch({
							type: "SET_BACKGROUND",
							background: planDataWithBlobUrls.backgroundImage,
						});
					}
				} else {
					// Если плана нет, просто очищаем состояние
					dispatch({ type: "CLEAR_ALL" });
				}
			} catch (error) {
				console.error("Ошибка при загрузке плана:", error);
			} finally {
				setIsLoadingPlan(false);
			}
		};

		loadProjectPlan();
	}, [projectId, dispatch]);

	// Автосохранение (отключаем во время загрузки)
	const { savePlan } = useAutoSave({
		projectId,
		state,
		enabled: !isLoadingPlan, // Отключаем автосохранение во время загрузки
		debounceMs: 2000, // 2 секунды после действия
		intervalMs: 3 * 60 * 1000, // 3 минуты
		onSaveStart: () => {
			setSaveStatus("saving");
		},
		onSaveSuccess: () => {
			setSaveStatus("saved");
			// Сбрасываем статус через 2 секунды
			setTimeout(() => {
				setSaveStatus("idle");
			}, 2000);
		},
		onSaveError: (error) => {
			console.error("Ошибка автосохранения:", error);
			setSaveStatus("idle");
		},
	});

	const handleProjectNameSave = async (newName: string) => {
		setCurrentProjectName(newName);
		setIsSaving(true);

		try {
			const response = await fetch(`/api/projects/${projectId}/name`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ title: newName }),
			});

			if (!response.ok) {
				throw new Error("Failed to save project name");
			}

			const data = await response.json();
			console.log("Название проекта сохранено:", data.title);
		} catch (error) {
			console.error("Ошибка при сохранении названия проекта:", error);
			// TODO: Показать toast с ошибкой
		} finally {
			setIsSaving(false);
		}
	};

	// Обновляем размер canvas при изменении размера контейнера
	useEffect(() => {
		const updateSize = () => {
			if (containerRef.current) {
				const rect = containerRef.current.getBoundingClientRect();
				setCanvasSize({
					width: rect.width,
					height: rect.height,
				});
			}
		};

		updateSize();

		// Используем ResizeObserver для отслеживания изменений размера контейнера
		const resizeObserver = new ResizeObserver(() => {
			updateSize();
		});

		if (containerRef.current) {
			resizeObserver.observe(containerRef.current);
		}

		// Также слушаем изменения размера окна
		window.addEventListener("resize", updateSize);

		return () => {
			resizeObserver.disconnect();
			window.removeEventListener("resize", updateSize);
		};
	}, []);

	// Обработка полноэкранного режима
	const handleFullscreen = () => {
		if (!document.fullscreenElement) {
			containerRef.current?.parentElement?.requestFullscreen();
			setIsFullscreen(true);
		} else {
			document.exitFullscreen();
			setIsFullscreen(false);
		}
	};

	useEffect(() => {
		const handleFullscreenChange = () => {
			setIsFullscreen(!!document.fullscreenElement);
		};

		document.addEventListener("fullscreenchange", handleFullscreenChange);
		return () =>
			document.removeEventListener("fullscreenchange", handleFullscreenChange);
	}, []);

	// Экспорт конфигурации в JSON
	const handleExportJSON = () => {
		try {
			// Преобразуем Map в массивы для JSON
			const exportData = {
				nodes: Array.from(state.nodes.values()),
				walls: Array.from(state.walls.values()),
				doors: Array.from(state.doors.values()),
				windows: Array.from(state.windows.values()),
				rooms: Array.from(state.rooms.values()),
				furniture: Array.from(state.furniture.values()),
				dimensions: Array.from(state.dimensions.values()),
				layers: Array.from(state.layers.values()),
				camera: state.camera,
				backgroundImage: state.backgroundImage,
				gridSettings: state.gridSettings,
				planSettings: state.planSettings,
				snapMode: state.snapMode,
				version: "1.0",
				exportedAt: new Date().toISOString(),
			};

			const jsonData = JSON.stringify(exportData, null, 2);
			const blob = new Blob([jsonData], { type: "application/json" });
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `plan-${currentProjectName || "config"}-${
				new Date().toISOString().split("T")[0]
			}.json`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error("Ошибка при экспорте JSON:", error);
			alert("Ошибка при экспорте конфигурации");
		}
	};

	// Импорт конфигурации из JSON
	const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = async (e) => {
			try {
				const jsonData = e.target?.result as string;
				const importedData = JSON.parse(jsonData);

				// Валидация базовой структуры
				if (!importedData || typeof importedData !== "object") {
					throw new Error("Неверный формат файла");
				}

				// Конвертируем base64 data URLs обратно в blob URLs
				const { convertBase64ToBlobUrls } = await import(
					"@/lib/editor/textureUtils"
				);
				const dataWithBlobUrls = convertBase64ToBlobUrls(
					importedData
				) as typeof importedData;

				// Очищаем текущее состояние (кроме слоев, настроек и камеры)
				dispatch({ type: "CLEAR_ALL" });

				// Импортируем слои сначала (обновляем существующие)
				// CLEAR_ALL сохраняет слои, поэтому они должны существовать
				if (Array.isArray(dataWithBlobUrls.layers)) {
					dataWithBlobUrls.layers.forEach((layer: any) => {
						// UPDATE_LAYER безопасно обработает случай, если слоя нет
						dispatch({ type: "UPDATE_LAYER", id: layer.id, updates: layer });
					});
				}

				// Импортируем узлы (должны быть первыми, так как стены ссылаются на них)
				if (Array.isArray(dataWithBlobUrls.nodes)) {
					dataWithBlobUrls.nodes.forEach((node: any) => {
						dispatch({ type: "ADD_NODE", node });
					});
				}

				// Импортируем стены (после узлов)
				if (Array.isArray(dataWithBlobUrls.walls)) {
					dataWithBlobUrls.walls.forEach((wall: any) => {
						dispatch({ type: "ADD_WALL", wall });
					});
				}

				// Импортируем двери (после стен)
				if (Array.isArray(dataWithBlobUrls.doors)) {
					dataWithBlobUrls.doors.forEach((door: any) => {
						dispatch({ type: "ADD_DOOR", door });
					});
				}

				// Импортируем окна (после стен)
				if (Array.isArray(dataWithBlobUrls.windows)) {
					dataWithBlobUrls.windows.forEach((window: any) => {
						dispatch({ type: "ADD_WINDOW", window });
					});
				}

				// Импортируем комнаты
				if (Array.isArray(dataWithBlobUrls.rooms)) {
					dataWithBlobUrls.rooms.forEach((room: any) => {
						dispatch({ type: "ADD_ROOM", room });
					});
				}

				// Импортируем мебель
				if (Array.isArray(dataWithBlobUrls.furniture)) {
					dataWithBlobUrls.furniture.forEach((furniture: any) => {
						dispatch({ type: "ADD_FURNITURE", furniture });
					});
				}

				// Импортируем размерные линии
				if (Array.isArray(dataWithBlobUrls.dimensions)) {
					dataWithBlobUrls.dimensions.forEach((dimension: any) => {
						dispatch({ type: "ADD_DIMENSION", dimension });
					});
				}

				// Импортируем камеру
				if (dataWithBlobUrls.camera) {
					dispatch({ type: "SET_CAMERA", camera: dataWithBlobUrls.camera });
				}

				// Импортируем фоновое изображение
				if (dataWithBlobUrls.backgroundImage !== undefined) {
					dispatch({
						type: "SET_BACKGROUND",
						background: dataWithBlobUrls.backgroundImage,
					});
				}

				// Очищаем input для возможности повторного выбора того же файла
				if (fileInputRef.current) {
					fileInputRef.current.value = "";
				}

				alert("Конфигурация успешно импортирована");
			} catch (error) {
				console.error("Ошибка при импорте JSON:", error);
				alert("Ошибка при импорте конфигурации. Проверьте формат файла.");
			}
		};
		reader.readAsText(file);
	};

	return (
		<div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-950">
			{/* Обработчик клавиатуры */}
			<KeyboardHandler />

			{/* Индикатор истории */}
			<HistoryIndicator />

			{/* Шапка */}
			<div className="flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
				<div className="flex items-center gap-3">
					<button
						onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
						className="lg:hidden flex items-center justify-center w-10 h-10 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
						title={isSidebarCollapsed ? "Показать меню" : "Скрыть меню"}
					>
						<Menu size={20} />
					</button>
					<div>
						<EditableProjectName
							initialName={currentProjectName}
							onSave={handleProjectNameSave}
							isSaving={isSaving}
						/>
						<p className="text-xs text-gray-500 dark:text-gray-400">
							2D Планер
						</p>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<ThemeToggle />

					{/* Переключатель 2D/3D */}
					<div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-md p-1">
						<button
							onClick={() => setViewMode("2d")}
							className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition-colors ${
								viewMode === "2d"
									? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
									: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
							}`}
							title="2D вид"
						>
							<Grid2X2 size={16} />
							<span>2D</span>
						</button>
						<button
							onClick={() => setViewMode("3d")}
							className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition-colors ${
								viewMode === "3d"
									? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
									: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
							}`}
							title="3D вид"
						>
							<Box size={16} />
							<span>3D</span>
						</button>
					</div>

					<button
						onClick={handleExportJSON}
						className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
						title="Экспорт в JSON"
					>
						<Download size={16} />
						<span>Экспорт</span>
					</button>

					<label className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors cursor-pointer">
						<Upload size={16} />
						<span>Импорт</span>
						<input
							ref={fileInputRef}
							type="file"
							accept=".json,application/json"
							onChange={handleImportJSON}
							className="hidden"
						/>
					</label>

					<button
						onClick={async () => {
							setIsSaving(true);
							setSaveStatus("saving");
							try {
								await savePlan();
								setSaveStatus("saved");
								setTimeout(() => {
									setSaveStatus("idle");
								}, 2000);
							} catch (error) {
								console.error("Ошибка при сохранении:", error);
								setSaveStatus("idle");
								alert("Ошибка при сохранении. Попробуйте еще раз.");
							} finally {
								setIsSaving(false);
							}
						}}
						disabled={isSaving || saveStatus === "saving"}
						className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						title="Сохранить"
					>
						{saveStatus === "saved" ? (
							<>
								<CheckCircle2 size={16} />
								<span>Сохранено</span>
							</>
						) : saveStatus === "saving" ? (
							<>
								<Save size={16} className="animate-spin" />
								<span>Сохранение...</span>
							</>
						) : (
							<>
								<Save size={16} />
								<span>Сохранить</span>
							</>
						)}
					</button>

					<button
						onClick={handleFullscreen}
						className="flex items-center justify-center w-10 h-10 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
						title={
							isFullscreen
								? "Выйти из полноэкранного режима"
								: "Полноэкранный режим"
						}
					>
						<Maximize2 size={20} />
					</button>
				</div>
			</div>

			{/* Основная область */}
			<div className="flex flex-1 overflow-hidden">
				{/* Canvas / 3D Viewer */}
				<div
					ref={containerRef}
					className="flex-1 relative bg-gray-50 dark:bg-gray-900"
				>
					{isLoadingPlan ? (
						<div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 dark:bg-gray-900/80 z-50">
							<div className="flex flex-col items-center gap-3">
								<Loader2 className="h-8 w-8 animate-spin text-blue-600" />
								<p className="text-sm text-gray-600 dark:text-gray-400">
									Загрузка планировки...
								</p>
							</div>
						</div>
					) : viewMode === "2d" ? (
						<>
							<Canvas width={canvasSize.width} height={canvasSize.height} />

							{/* Toolbar (плавающий) */}
							<Toolbar />

							{/* Статус-бар */}
							<StatusBar />
						</>
					) : (
						<>
							<Plan3DViewer
								state={state}
								className="w-full h-full"
								onObjectClick={(objectId, objectType, point) => {
									// Обработка клика по объекту в 3D (можно использовать для выделения)
									console.log(
										"3D object clicked:",
										objectId,
										objectType,
										point
									);
								}}
							/>

							{/* Подсказка для 3D режима */}
							<div className="absolute bottom-4 left-4 px-3 py-2 bg-white dark:bg-gray-800 rounded-md shadow-md border border-gray-200 dark:border-gray-700 max-w-xs">
								<div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
									<div className="font-medium">3D режим просмотра</div>
									<div className="text-gray-400 dark:text-gray-500 mt-1">
										ЛКМ - вращение камеры
									</div>
									<div className="text-gray-400 dark:text-gray-500">
										СКМ / ПКМ - панорамирование
									</div>
									<div className="text-gray-400 dark:text-gray-500">
										Колесо - зум
									</div>
								</div>
							</div>
						</>
					)}
				</div>

				{/* Правая панель */}
				<RightPanel />
			</div>

			{/* Виджет чата с AI */}
			<ChatWidget projectId={projectId} />
		</div>
	);
}

// Статус-бар с подсказками
function StatusBar() {
	const { state, canUndo, canRedo } = useEditor();

	const getToolHint = () => {
		switch (state.activeTool) {
			case "wall":
				if (state.wallDrawingState.isDrawing) {
					return (
						<>
							<div className="font-medium">Рисование стены</div>
							<div className="text-gray-400 dark:text-gray-500 mt-1">
								Стены соединяются под прямым углом (90°)
							</div>
							<div className="text-gray-400 dark:text-gray-500">
								<kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
									Ctrl
								</kbd>{" "}
								+ колесо - изменить угол
							</div>
							<div className="text-gray-400 dark:text-gray-500">
								<kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
									ESC
								</kbd>{" "}
								- завершить
							</div>
						</>
					);
				}
				return "Нажмите W для стены";
			case "door":
				return "Кликните на стену для добавления двери";
			case "window":
				return "Кликните на стену для добавления окна";
			case "furniture":
				if (state.selection.id && state.selection.type === "furniture") {
					return (
						<>
							<div className="font-medium">Мебель выделена</div>
							<div className="text-gray-400 dark:text-gray-500 mt-1">
								Перетащите для перемещения
							</div>
							<div className="text-gray-400 dark:text-gray-500">
								<kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
									R
								</kbd>{" "}
								- повернуть на 90°
							</div>
						</>
					);
				}
				return (
					<>
						<div className="font-medium">Инструмент мебели</div>
						<div className="text-gray-400 dark:text-gray-500 mt-1">
							Выберите мебель в каталоге справа
						</div>
						<div className="text-gray-400 dark:text-gray-500">
							Кликните на план для размещения
						</div>
					</>
				);
			case "select":
				if (state.selection.id && state.selection.type) {
					return (
						<>
							<div className="font-medium">Объект выделен</div>
							<div className="text-gray-400 dark:text-gray-500 mt-1">
								Перетащите для перемещения
							</div>
							<div className="text-gray-400 dark:text-gray-500">
								{state.selection.type === "node" &&
									"Узлы перемещают связанные стены"}
								{state.selection.type === "wall" &&
									"Стена перемещается целиком (оба узла)"}
								{(state.selection.type === "door" ||
									state.selection.type === "window") &&
									"Перемещение вдоль стены"}
							</div>
							<div className="text-gray-400 dark:text-gray-500 mt-1">
								Измените размер через свойства в правой панели
							</div>
						</>
					);
				}
				return "Кликните на объект для выделения";
			default:
				return (
					<>
						Нажмите{" "}
						<kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
							V
						</kbd>{" "}
						для выделения,{" "}
						<kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
							W
						</kbd>{" "}
						для стены
					</>
				);
		}
	};

	return (
		<div className="absolute bottom-4 left-4 space-y-2">
			{/* Основные подсказки */}
			<div className="px-3 py-2 bg-white dark:bg-gray-800 rounded-md shadow-md border border-gray-200 dark:border-gray-700 max-w-xs">
				<div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
					{getToolHint()}
				</div>
			</div>

			{/* Индикатор истории */}
			<div className="px-3 py-1.5 bg-white dark:bg-gray-800 rounded-md shadow-md border border-gray-200 dark:border-gray-700">
				<div className="flex items-center gap-2 text-xs">
					<span className="text-gray-500 dark:text-gray-400">История:</span>
					<span className="font-medium text-gray-700 dark:text-gray-300">
						{state.historyIndex}/{state.history.length - 1}
					</span>
					<span className="text-gray-400 dark:text-gray-500">|</span>
					<span
						className={
							canUndo()
								? "text-blue-600 dark:text-blue-400"
								: "text-gray-400 dark:text-gray-600"
						}
					>
						Undo: {canUndo() ? "Да" : "Нет"}
					</span>
					<span
						className={
							canRedo()
								? "text-blue-600 dark:text-blue-400"
								: "text-gray-400 dark:text-gray-600"
						}
					>
						Redo: {canRedo() ? "Да" : "Нет"}
					</span>
				</div>
			</div>
		</div>
	);
}

export function Editor2D({ projectId, projectName }: Editor2DProps) {
	return (
		<EditorProvider>
			<EditorContent
				projectId={projectId}
				projectName={projectName || "Без названия"}
			/>
		</EditorProvider>
	);
}
