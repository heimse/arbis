"use client";

import React, { useState } from "react";
import { useEditor } from "@/store/editorStore";
import {
	ChevronRight,
	Eye,
	EyeOff,
	Square,
	DoorOpen,
	SquareDashedBottom,
	Circle,
	Armchair,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import type {
	Node,
	Wall,
	Door,
	Window,
	DoorHingeSide,
	DoorSwingDirection,
} from "@/types/editor";
import { FurnitureCatalogPanel } from "./FurnitureCatalogPanel";

export function RightPanel() {
	const [activeTab, setActiveTab] = useState("properties");
	const { state, dispatch } = useEditor();

	// Автоматически переключаемся на вкладку "Свойства" при выделении объекта
	React.useEffect(() => {
		if (
			state.selection.id &&
			state.selection.type &&
			activeTab !== "properties"
		) {
			setActiveTab("properties");
		}
	}, [state.selection.id, state.selection.type]); // Убрали activeTab из зависимостей

	// Автоматически открываем каталог при выборе инструмента мебели
	React.useEffect(() => {
		if (state.activeTool === "furniture" && activeTab !== "catalog") {
			setActiveTab("catalog");
		}
	}, [state.activeTool]); // Убрали activeTab из зависимостей

	return (
		<div className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col">
			{/* Заголовок */}
			<div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
				<h3 className="font-semibold text-gray-900 dark:text-gray-100">
					Свойства
				</h3>
			</div>

			{/* Вкладки */}
			<Tabs
				value={activeTab}
				onValueChange={setActiveTab}
				className="flex-1 flex flex-col min-h-0"
			>
				<TabsList className="w-full grid grid-cols-4 gap-0 bg-gray-50 dark:bg-gray-800 rounded-none border-b border-gray-200 dark:border-gray-700 shrink-0">
					<TabsTrigger
						value="properties"
						className="rounded-none data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900"
					>
						Свойства
					</TabsTrigger>
					<TabsTrigger
						value="catalog"
						className="rounded-none data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900"
					>
						<Armchair size={14} className="mr-1" />
						Каталог
					</TabsTrigger>
					<TabsTrigger
						value="layers"
						className="rounded-none data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900"
					>
						Слои
					</TabsTrigger>
					<TabsTrigger
						value="plan"
						className="rounded-none data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900"
					>
						Настройки
					</TabsTrigger>
				</TabsList>

				{/* Контейнер для контента вкладок */}
				<div className="flex-1 flex flex-col min-h-0 relative">
					{/* Свойства объекта */}
					<TabsContent
						value="properties"
						className="absolute inset-0 flex flex-col overflow-hidden mt-0 data-[state=inactive]:hidden"
					>
						<div className="flex-1 overflow-y-auto p-4">
							<ObjectProperties />
						</div>
					</TabsContent>

					{/* Каталог мебели */}
					<TabsContent
						value="catalog"
						className="absolute inset-0 flex flex-col overflow-hidden mt-0 data-[state=inactive]:hidden"
					>
						<FurnitureCatalogPanel />
					</TabsContent>

					{/* Слои */}
					<TabsContent
						value="layers"
						className="absolute inset-0 flex flex-col overflow-hidden mt-0 data-[state=inactive]:hidden"
					>
						<LayersPanel />
					</TabsContent>

					{/* Настройки */}
					<TabsContent
						value="plan"
						className="absolute inset-0 flex flex-col overflow-hidden mt-0 data-[state=inactive]:hidden"
					>
						<div className="flex-1 overflow-y-auto p-4">
							<PlanSettings />
						</div>
					</TabsContent>
				</div>
			</Tabs>
		</div>
	);
}

// Свойства выбранного объекта
function ObjectProperties() {
	const { state } = useEditor();

	if (!state.selection.id || !state.selection.type) {
		return (
			<div className="text-sm text-gray-500 dark:text-gray-400">
				Выберите объект для редактирования свойств
			</div>
		);
	}

	switch (state.selection.type) {
		case "node":
			return <NodeProperties />;
		case "wall":
			return <WallProperties />;
		case "door":
			return <DoorProperties />;
		case "window":
			return <WindowProperties />;
		case "furniture":
			return <FurnitureProperties />;
		case "dimension":
			return <DimensionProperties />;
		case "room":
			return <RoomProperties />;
		default:
			return null;
	}
}

function NodeProperties() {
	const { state, dispatch } = useEditor();
	const node = state.nodes.get(state.selection.id!);

	if (!node) return null;

	// Получаем информацию о связанных стенах
	const connectedWalls = node.connectedWalls
		.map((wallId) => state.walls.get(wallId))
		.filter((wall): wall is Wall => wall !== undefined);

	return (
		<div className="space-y-4">
			<h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">
				Узел
			</h4>

			{/* Координаты */}
			<div className="space-y-3">
				<div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
					Координаты
				</div>

				<div className="grid grid-cols-2 gap-2">
					<div className="space-y-2">
						<label className="text-sm text-gray-600 dark:text-gray-400">
							X (м)
						</label>
						<Input
							type="number"
							value={node.x.toFixed(3)}
							onChange={(e) => {
								dispatch({
									type: "UPDATE_NODE",
									id: node.id,
									updates: { x: parseFloat(e.target.value) || 0 },
								});
							}}
							step="0.01"
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm text-gray-600 dark:text-gray-400">
							Y (м)
						</label>
						<Input
							type="number"
							value={node.y.toFixed(3)}
							onChange={(e) => {
								dispatch({
									type: "UPDATE_NODE",
									id: node.id,
									updates: { y: parseFloat(e.target.value) || 0 },
								});
							}}
							step="0.01"
						/>
					</div>
				</div>
			</div>

			{/* Связанные стены */}
			{connectedWalls.length > 0 && (
				<div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-800">
					<div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
						Связанные стены ({connectedWalls.length})
					</div>

					<div className="space-y-1 max-h-32 overflow-y-auto">
						{connectedWalls.map((wall) => {
							const otherNodeId =
								wall.startNodeId === node.id
									? wall.endNodeId
									: wall.startNodeId;
							const otherNode = state.nodes.get(otherNodeId);
							const length = otherNode
								? Math.sqrt(
										Math.pow(otherNode.x - node.x, 2) +
											Math.pow(otherNode.y - node.y, 2)
								  ).toFixed(2)
								: "?";

							return (
								<div
									key={wall.id}
									className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs"
								>
									<span className="text-gray-600 dark:text-gray-400">
										{wall.type === "load-bearing" ? "Несущая" : "Перегородка"}
									</span>
									<span className="text-gray-500 dark:text-gray-500 font-mono">
										{length} м
									</span>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* Информация */}
			<div className="pt-2 border-t border-gray-200 dark:border-gray-800">
				<div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
					<div>
						ID: <span className="font-mono">{node.id}</span>
					</div>
					<div>
						Связано стен:{" "}
						<span className="font-medium">{node.connectedWalls.length}</span>
					</div>
				</div>
			</div>
		</div>
	);
}

function WallProperties() {
	const { state, dispatch } = useEditor();
	const wall = state.walls.get(state.selection.id!);

	if (!wall) return null;

	const startNode = state.nodes.get(wall.startNodeId);
	const endNode = state.nodes.get(wall.endNodeId);

	if (!startNode || !endNode) return null;

	// Вычисляем длину и угол
	const dx = endNode.x - startNode.x;
	const dy = endNode.y - startNode.y;
	const length = Math.sqrt(dx * dx + dy * dy);
	const angle = Math.atan2(dy, dx) * (180 / Math.PI);

	return (
		<div className="space-y-4">
			<h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">
				Стена
			</h4>

			{/* Основные параметры */}
			<div className="space-y-3">
				<div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
					Основные параметры
				</div>

				<div className="space-y-2">
					<label className="text-sm text-gray-600 dark:text-gray-400">
						Тип
					</label>
					<select
						value={wall.type}
						onChange={(e) => {
							dispatch({
								type: "UPDATE_WALL",
								id: wall.id,
								updates: {
									type: e.target.value as "load-bearing" | "partition",
								},
							});
						}}
						className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md text-sm"
					>
						<option value="partition">Перегородка</option>
						<option value="load-bearing">Несущая</option>
					</select>
				</div>

				<div className="space-y-2">
					<label className="text-sm text-gray-600 dark:text-gray-400">
						Толщина (мм)
					</label>
					<Input
						type="number"
						value={wall.thickness}
						onChange={(e) => {
							dispatch({
								type: "UPDATE_WALL",
								id: wall.id,
								updates: { thickness: parseInt(e.target.value) || 100 },
							});
						}}
						step="10"
						min="50"
						max="500"
					/>
				</div>

				<div className="space-y-2">
					<label className="text-sm text-gray-600 dark:text-gray-400">
						Высота (м)
					</label>
					<Input
						type="number"
						value={(wall.height || 2.7).toFixed(2)}
						onChange={(e) => {
							const height = parseFloat(e.target.value) || 2.7;
							if (height > 0) {
								dispatch({
									type: "UPDATE_WALL",
									id: wall.id,
									updates: { height },
								});
							}
						}}
						step="0.1"
						min="1.5"
						max="5.0"
					/>
				</div>

				<div className="space-y-2">
					<label className="text-sm text-gray-600 dark:text-gray-400">
						Длина (м)
					</label>
					<Input
						type="number"
						value={length.toFixed(3)}
						readOnly
						className="bg-gray-50 dark:bg-gray-900"
					/>
				</div>

				<div className="space-y-2">
					<label className="text-sm text-gray-600 dark:text-gray-400">
						Угол (°)
					</label>
					<Input
						type="number"
						value={angle.toFixed(1)}
						readOnly
						className="bg-gray-50 dark:bg-gray-900"
					/>
				</div>
			</div>

			{/* Координаты начального узла */}
			<div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-800">
				<div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
					Начальный узел
				</div>

				<div className="grid grid-cols-2 gap-2">
					<div className="space-y-2">
						<label className="text-sm text-gray-600 dark:text-gray-400">
							X (м)
						</label>
						<Input
							type="number"
							value={startNode.x.toFixed(3)}
							onChange={(e) => {
								dispatch({
									type: "UPDATE_NODE",
									id: wall.startNodeId,
									updates: { x: parseFloat(e.target.value) || 0 },
								});
							}}
							step="0.01"
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm text-gray-600 dark:text-gray-400">
							Y (м)
						</label>
						<Input
							type="number"
							value={startNode.y.toFixed(3)}
							onChange={(e) => {
								dispatch({
									type: "UPDATE_NODE",
									id: wall.startNodeId,
									updates: { y: parseFloat(e.target.value) || 0 },
								});
							}}
							step="0.01"
						/>
					</div>
				</div>
			</div>

			{/* Координаты конечного узла */}
			<div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-800">
				<div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
					Конечный узел
				</div>

				<div className="grid grid-cols-2 gap-2">
					<div className="space-y-2">
						<label className="text-sm text-gray-600 dark:text-gray-400">
							X (м)
						</label>
						<Input
							type="number"
							value={endNode.x.toFixed(3)}
							onChange={(e) => {
								dispatch({
									type: "UPDATE_NODE",
									id: wall.endNodeId,
									updates: { x: parseFloat(e.target.value) || 0 },
								});
							}}
							step="0.01"
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm text-gray-600 dark:text-gray-400">
							Y (м)
						</label>
						<Input
							type="number"
							value={endNode.y.toFixed(3)}
							onChange={(e) => {
								dispatch({
									type: "UPDATE_NODE",
									id: wall.endNodeId,
									updates: { y: parseFloat(e.target.value) || 0 },
								});
							}}
							step="0.01"
						/>
					</div>
				</div>
			</div>

			{/* Материал стены */}
			<div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-800">
				<div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
					Материал стены
				</div>

				{/* Режим заливки */}
				<div className="space-y-2">
					<label className="text-sm text-gray-600 dark:text-gray-400">
						Режим заливки
					</label>
					<select
						value={wall.fillMode ?? "color"}
						onChange={(e) => {
							dispatch({
								type: "UPDATE_WALL",
								id: wall.id,
								updates: {
									fillMode: e.target.value as "color" | "texture",
								},
							});
						}}
						className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
					>
						<option value="color">Цвет</option>
						<option value="texture">Текстура</option>
					</select>
				</div>

				{/* Цвет стены */}
				{wall.fillMode !== "texture" && (
					<div className="space-y-2">
						<label className="text-sm text-gray-600 dark:text-gray-400">
							Цвет стены
						</label>
						<div className="flex gap-2">
							<Input
								type="color"
								value={
									wall.color ??
									(wall.type === "load-bearing" ? "#374151" : "#9ca3af")
								}
								onChange={(e) => {
									dispatch({
										type: "UPDATE_WALL",
										id: wall.id,
										updates: { color: e.target.value },
									});
								}}
								className="w-16 h-10 p-1 border border-gray-300 dark:border-gray-700 rounded-md cursor-pointer"
							/>
							<Input
								type="text"
								value={
									wall.color ??
									(wall.type === "load-bearing" ? "#374151" : "#9ca3af")
								}
								onChange={(e) => {
									dispatch({
										type: "UPDATE_WALL",
										id: wall.id,
										updates: { color: e.target.value },
									});
								}}
								placeholder={
									wall.type === "load-bearing" ? "#374151" : "#9ca3af"
								}
								className="flex-1"
							/>
						</div>
					</div>
				)}

				{/* Текстура стены */}
				{wall.fillMode === "texture" && (
					<>
						<div className="space-y-2">
							<label className="text-sm text-gray-600 dark:text-gray-400">
								Текстура стены
							</label>
							<div className="flex gap-2">
								<Input
									type="file"
									accept="image/*"
									onChange={(e) => {
										const file = e.target.files?.[0];
										if (file) {
											const url = URL.createObjectURL(file);
											dispatch({
												type: "UPDATE_WALL",
												id: wall.id,
												updates: {
													texture: url,
													fillMode: "texture",
												},
											});
										}
									}}
									className="flex-1 text-sm"
								/>
								{wall.texture && (
									<button
										type="button"
										onClick={() => {
											// Освобождаем blob URL
											if (wall.texture?.startsWith("blob:")) {
												URL.revokeObjectURL(wall.texture);
											}
											dispatch({
												type: "UPDATE_WALL",
												id: wall.id,
												updates: {
													texture: null,
													fillMode: "color",
												},
											});
										}}
										className="px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
									>
										Удалить
									</button>
								)}
							</div>
							{wall.texture && (
								<div className="mt-2">
									<img
										src={wall.texture}
										alt="Предпросмотр текстуры"
										className="w-full h-24 object-cover rounded-md border border-gray-300 dark:border-gray-700"
									/>
								</div>
							)}
						</div>

						{/* Масштаб текстуры */}
						{wall.texture && (
							<div className="grid grid-cols-2 gap-2">
								<div className="space-y-2">
									<label className="text-sm text-gray-600 dark:text-gray-400">
										Масштаб X
									</label>
									<Input
										type="number"
										value={wall.textureScale?.x ?? 1}
										onChange={(e) => {
											const scaleX = parseFloat(e.target.value) || 1;
											dispatch({
												type: "UPDATE_WALL",
												id: wall.id,
												updates: {
													textureScale: {
														x: scaleX,
														y: wall.textureScale?.y ?? 1,
													},
												},
											});
										}}
										step="0.1"
										min="0.1"
									/>
								</div>
								<div className="space-y-2">
									<label className="text-sm text-gray-600 dark:text-gray-400">
										Масштаб Y
									</label>
									<Input
										type="number"
										value={wall.textureScale?.y ?? 1}
										onChange={(e) => {
											const scaleY = parseFloat(e.target.value) || 1;
											dispatch({
												type: "UPDATE_WALL",
												id: wall.id,
												updates: {
													textureScale: {
														x: wall.textureScale?.x ?? 1,
														y: scaleY,
													},
												},
											});
										}}
										step="0.1"
										min="0.1"
									/>
								</div>
							</div>
						)}
					</>
				)}
			</div>

			{/* Информация */}
			<div className="pt-2 border-t border-gray-200 dark:border-gray-800">
				<div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
					<div>
						ID: <span className="font-mono">{wall.id}</span>
					</div>
					<div>
						Слой:{" "}
						<span className="font-medium">
							{state.layers.get(wall.layerId)?.name || "Неизвестно"}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}

/**
 * Нормализует дверь: извлекает hingeSide и swingDirection с учётом обратной совместимости
 */
function normalizeDoorOrientation(door: Door): {
	hingeSide: DoorHingeSide;
	swingDirection: DoorSwingDirection;
} {
	// Если уже есть новые поля - используем их
	if (door.hingeSide && door.swingDirection) {
		return {
			hingeSide: door.hingeSide,
			swingDirection: door.swingDirection,
		};
	}

	// Миграция со старого формата
	const hingeSide: DoorHingeSide =
		door.hingeSide ?? door.openDirection ?? "right";
	const swingDirection: DoorSwingDirection = door.swingDirection ?? "inside";

	return { hingeSide, swingDirection };
}

function DoorProperties() {
	const { state, dispatch } = useEditor();
	const door = state.doors.get(state.selection.id!);

	if (!door) return null;

	const wall = state.walls.get(door.wallId);
	if (!wall) return null;

	const startNode = state.nodes.get(wall.startNodeId);
	const endNode = state.nodes.get(wall.endNodeId);
	if (!startNode || !endNode) return null;

	// Нормализуем ориентацию двери (миграция со старого формата)
	const { hingeSide, swingDirection } = normalizeDoorOrientation(door);

	// Вычисляем позицию двери
	const doorPos = {
		x: startNode.x + (endNode.x - startNode.x) * door.position,
		y: startNode.y + (endNode.y - startNode.y) * door.position,
	};

	return (
		<div className="space-y-4">
			<h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">
				Дверь
			</h4>

			{/* Размеры */}
			<div className="space-y-3">
				<div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
					Размеры
				</div>

				<div className="grid grid-cols-2 gap-2">
					<div className="space-y-2">
						<label className="text-sm text-gray-600 dark:text-gray-400">
							Ширина (мм)
						</label>
						<Input
							type="number"
							value={door.width}
							onChange={(e) => {
								dispatch({
									type: "UPDATE_DOOR",
									id: door.id,
									updates: { width: parseInt(e.target.value) || 900 },
								});
							}}
							step="10"
							min="400"
							max="2000"
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm text-gray-600 dark:text-gray-400">
							Высота (мм)
						</label>
						<Input
							type="number"
							value={door.height}
							onChange={(e) => {
								dispatch({
									type: "UPDATE_DOOR",
									id: door.id,
									updates: { height: parseInt(e.target.value) || 2100 },
								});
							}}
							step="10"
							min="1500"
							max="3000"
						/>
					</div>
				</div>
			</div>

			{/* Позиция */}
			<div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-800">
				<div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
					Позиция
				</div>

				<div className="space-y-2">
					<label className="text-sm text-gray-600 dark:text-gray-400">
						Позиция вдоль стены (0-1)
					</label>
					<Input
						type="number"
						value={door.position.toFixed(3)}
						onChange={(e) => {
							const newPos = Math.max(
								0,
								Math.min(1, parseFloat(e.target.value) || 0.5)
							);
							dispatch({
								type: "UPDATE_DOOR",
								id: door.id,
								updates: { position: newPos },
							});
						}}
						step="0.01"
						min="0"
						max="1"
					/>
				</div>

				<div className="grid grid-cols-2 gap-2">
					<div className="space-y-2">
						<label className="text-sm text-gray-600 dark:text-gray-400">
							X (м)
						</label>
						<Input
							type="number"
							value={doorPos.x.toFixed(3)}
							readOnly
							className="bg-gray-50 dark:bg-gray-900"
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm text-gray-600 dark:text-gray-400">
							Y (м)
						</label>
						<Input
							type="number"
							value={doorPos.y.toFixed(3)}
							readOnly
							className="bg-gray-50 dark:bg-gray-900"
						/>
					</div>
				</div>
			</div>

			{/* Настройки */}
			<div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-800">
				<div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
					Настройки
				</div>

				<div className="space-y-2">
					<label className="text-sm text-gray-600 dark:text-gray-400">
						Сторона петель (относительно направления стены)
					</label>
					<select
						value={hingeSide}
						onChange={(e) => {
							dispatch({
								type: "UPDATE_DOOR",
								id: door.id,
								updates: { hingeSide: e.target.value as DoorHingeSide },
							});
						}}
						className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md text-sm"
					>
						<option value="left">Слева</option>
						<option value="right">Справа</option>
					</select>
				</div>

				<div className="space-y-2">
					<label className="text-sm text-gray-600 dark:text-gray-400">
						Направление открытия (внутрь / наружу)
					</label>
					<select
						value={swingDirection}
						onChange={(e) => {
							dispatch({
								type: "UPDATE_DOOR",
								id: door.id,
								updates: {
									swingDirection: e.target.value as DoorSwingDirection,
								},
							});
						}}
						className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md text-sm"
					>
						<option value="inside">Внутрь</option>
						<option value="outside">Наружу</option>
					</select>
				</div>
			</div>

			{/* Информация */}
			<div className="pt-2 border-t border-gray-200 dark:border-gray-800">
				<div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
					<div>
						ID: <span className="font-mono">{door.id}</span>
					</div>
					<div>
						Стена:{" "}
						<span className="font-mono">{wall.id.substring(0, 8)}...</span>
					</div>
					<div>
						Слой:{" "}
						<span className="font-medium">
							{state.layers.get(door.layerId)?.name || "Неизвестно"}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}

function WindowProperties() {
	const { state, dispatch } = useEditor();
	const window = state.windows.get(state.selection.id!);

	if (!window) return null;

	const wall = state.walls.get(window.wallId);
	if (!wall) return null;

	const startNode = state.nodes.get(wall.startNodeId);
	const endNode = state.nodes.get(wall.endNodeId);
	if (!startNode || !endNode) return null;

	// Вычисляем позицию окна
	const windowPos = {
		x: startNode.x + (endNode.x - startNode.x) * window.position,
		y: startNode.y + (endNode.y - startNode.y) * window.position,
	};

	return (
		<div className="space-y-4">
			<h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">
				Окно
			</h4>

			{/* Размеры */}
			<div className="space-y-3">
				<div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
					Размеры
				</div>

				<div className="grid grid-cols-2 gap-2">
					<div className="space-y-2">
						<label className="text-sm text-gray-600 dark:text-gray-400">
							Ширина (мм)
						</label>
						<Input
							type="number"
							value={window.width}
							onChange={(e) => {
								dispatch({
									type: "UPDATE_WINDOW",
									id: window.id,
									updates: { width: parseInt(e.target.value) || 1200 },
								});
							}}
							step="10"
							min="400"
							max="5000"
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm text-gray-600 dark:text-gray-400">
							Высота (мм)
						</label>
						<Input
							type="number"
							value={window.height}
							onChange={(e) => {
								dispatch({
									type: "UPDATE_WINDOW",
									id: window.id,
									updates: { height: parseInt(e.target.value) || 1400 },
								});
							}}
							step="10"
							min="400"
							max="3000"
						/>
					</div>
				</div>

				<div className="space-y-2">
					<label className="text-sm text-gray-600 dark:text-gray-400">
						Высота подоконника (мм)
					</label>
					<Input
						type="number"
						value={window.sillHeight}
						onChange={(e) => {
							dispatch({
								type: "UPDATE_WINDOW",
								id: window.id,
								updates: { sillHeight: parseInt(e.target.value) || 800 },
							});
						}}
						step="10"
						min="0"
						max="1500"
					/>
				</div>
			</div>

			{/* Позиция */}
			<div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-800">
				<div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
					Позиция
				</div>

				<div className="space-y-2">
					<label className="text-sm text-gray-600 dark:text-gray-400">
						Позиция вдоль стены (0-1)
					</label>
					<Input
						type="number"
						value={window.position.toFixed(3)}
						onChange={(e) => {
							const newPos = Math.max(
								0,
								Math.min(1, parseFloat(e.target.value) || 0.5)
							);
							dispatch({
								type: "UPDATE_WINDOW",
								id: window.id,
								updates: { position: newPos },
							});
						}}
						step="0.01"
						min="0"
						max="1"
					/>
				</div>

				<div className="grid grid-cols-2 gap-2">
					<div className="space-y-2">
						<label className="text-sm text-gray-600 dark:text-gray-400">
							X (м)
						</label>
						<Input
							type="number"
							value={windowPos.x.toFixed(3)}
							readOnly
							className="bg-gray-50 dark:bg-gray-900"
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm text-gray-600 dark:text-gray-400">
							Y (м)
						</label>
						<Input
							type="number"
							value={windowPos.y.toFixed(3)}
							readOnly
							className="bg-gray-50 dark:bg-gray-900"
						/>
					</div>
				</div>
			</div>

			{/* Информация */}
			<div className="pt-2 border-t border-gray-200 dark:border-gray-800">
				<div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
					<div>
						ID: <span className="font-mono">{window.id}</span>
					</div>
					<div>
						Стена:{" "}
						<span className="font-mono">{wall.id.substring(0, 8)}...</span>
					</div>
					<div>
						Слой:{" "}
						<span className="font-medium">
							{state.layers.get(window.layerId)?.name || "Неизвестно"}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}

// Получить дефолтную высоту мебели по типу
function getDefaultFurnitureHeight(type: string): number {
	switch (type) {
		case "bed":
			return 0.4;
		case "sofa":
			return 0.8;
		case "table":
			return 0.75;
		case "chair":
			return 1.0;
		default:
			return 0.5;
	}
}

// Свойства мебели
function FurnitureProperties() {
	const { state, dispatch } = useEditor();
	const furniture = state.furniture.get(state.selection.id!);

	if (!furniture) return null;

	return (
		<div className="space-y-4">
			<h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">
				Мебель
			</h4>

			{/* Основные параметры */}
			<div className="space-y-3">
				<div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
					Основные параметры
				</div>

				<div className="space-y-2">
					<label className="text-sm text-gray-600 dark:text-gray-400">
						Тип
					</label>
					<Input
						type="text"
						value={furniture.type}
						onChange={(e) => {
							dispatch({
								type: "UPDATE_FURNITURE",
								id: furniture.id,
								updates: { type: e.target.value },
							});
						}}
						placeholder="Тип мебели"
					/>
				</div>

				<div className="grid grid-cols-2 gap-2">
					<div className="space-y-2">
						<label className="text-sm text-gray-600 dark:text-gray-400">
							Ширина (м)
						</label>
						<Input
							type="number"
							value={furniture.size.width.toFixed(3)}
							onChange={(e) => {
								const width = parseFloat(e.target.value) || 0;
								if (width > 0) {
									dispatch({
										type: "UPDATE_FURNITURE",
										id: furniture.id,
										updates: {
											size: { ...furniture.size, width },
										},
									});
								}
							}}
							step="0.01"
							min="0.1"
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm text-gray-600 dark:text-gray-400">
							Глубина (м)
						</label>
						<Input
							type="number"
							value={furniture.size.height.toFixed(3)}
							onChange={(e) => {
								const height = parseFloat(e.target.value) || 0;
								if (height > 0) {
									dispatch({
										type: "UPDATE_FURNITURE",
										id: furniture.id,
										updates: {
											size: { ...furniture.size, height },
										},
									});
								}
							}}
							step="0.01"
							min="0.1"
						/>
					</div>
				</div>

				<div className="space-y-2">
					<label className="text-sm text-gray-600 dark:text-gray-400">
						Высота (м) - для 3D
					</label>
					<Input
						type="number"
						value={(
							furniture.height || getDefaultFurnitureHeight(furniture.type)
						).toFixed(2)}
						onChange={(e) => {
							const height = parseFloat(e.target.value) || 0;
							if (height > 0) {
								dispatch({
									type: "UPDATE_FURNITURE",
									id: furniture.id,
									updates: { height },
								});
							}
						}}
						step="0.1"
						min="0.1"
						max="3.0"
					/>
				</div>

				<div className="space-y-2">
					<label className="text-sm text-gray-600 dark:text-gray-400">
						Угол поворота (°)
					</label>
					<Input
						type="number"
						value={furniture.rotation.toFixed(1)}
						onChange={(e) => {
							const rotation = parseFloat(e.target.value) || 0;
							dispatch({
								type: "UPDATE_FURNITURE",
								id: furniture.id,
								updates: { rotation },
							});
						}}
						step="1"
					/>
				</div>
			</div>

			{/* Позиция */}
			<div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-800">
				<div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
					Позиция
				</div>

				<div className="grid grid-cols-2 gap-2">
					<div className="space-y-2">
						<label className="text-sm text-gray-600 dark:text-gray-400">
							X (м)
						</label>
						<Input
							type="number"
							value={furniture.position.x.toFixed(3)}
							onChange={(e) => {
								const x = parseFloat(e.target.value) || 0;
								dispatch({
									type: "UPDATE_FURNITURE",
									id: furniture.id,
									updates: { position: { ...furniture.position, x } },
								});
							}}
							step="0.01"
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm text-gray-600 dark:text-gray-400">
							Y (м)
						</label>
						<Input
							type="number"
							value={furniture.position.y.toFixed(3)}
							onChange={(e) => {
								const y = parseFloat(e.target.value) || 0;
								dispatch({
									type: "UPDATE_FURNITURE",
									id: furniture.id,
									updates: { position: { ...furniture.position, y } },
								});
							}}
							step="0.01"
						/>
					</div>
				</div>
			</div>

			{/* Информация */}
			<div className="pt-2 border-t border-gray-200 dark:border-gray-800">
				<div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
					<div>
						ID: <span className="font-mono">{furniture.id}</span>
					</div>
					<div>
						Слой:{" "}
						<span className="font-medium">
							{state.layers.get(furniture.layerId)?.name || "Неизвестно"}
						</span>
					</div>
					<div>
						Площадь:{" "}
						<span className="font-medium">
							{(furniture.size.width * furniture.size.height).toFixed(2)} м²
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}

// Свойства размерной линии
function DimensionProperties() {
	const { state, dispatch } = useEditor();
	const dimension = state.dimensions.get(state.selection.id!);

	if (!dimension) return null;

	// Вычисляем длину
	const dx = dimension.endPoint.x - dimension.startPoint.x;
	const dy = dimension.endPoint.y - dimension.startPoint.y;
	const length = Math.sqrt(dx * dx + dy * dy);

	return (
		<div className="space-y-4">
			<h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">
				Размерная линия
			</h4>

			{/* Основные параметры */}
			<div className="space-y-3">
				<div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
					Основные параметры
				</div>

				<div className="space-y-2">
					<label className="text-sm text-gray-600 dark:text-gray-400">
						Длина (м)
					</label>
					<Input
						type="number"
						value={length.toFixed(3)}
						readOnly
						className="bg-gray-50 dark:bg-gray-900"
					/>
				</div>

				<div className="space-y-2">
					<label className="text-sm text-gray-600 dark:text-gray-400">
						Смещение (м)
					</label>
					<Input
						type="number"
						value={dimension.offset.toFixed(2)}
						onChange={(e) => {
							const offset = parseFloat(e.target.value) || 0;
							dispatch({
								type: "UPDATE_DIMENSION",
								id: dimension.id,
								updates: { offset },
							});
						}}
						step="0.1"
					/>
				</div>

				<div className="space-y-2">
					<label className="text-sm text-gray-600 dark:text-gray-400">
						Текст (опционально)
					</label>
					<Input
						type="text"
						value={dimension.text || ""}
						onChange={(e) => {
							dispatch({
								type: "UPDATE_DIMENSION",
								id: dimension.id,
								updates: { text: e.target.value || undefined },
							});
						}}
						placeholder="Автоматически"
					/>
				</div>
			</div>

			{/* Начальная точка */}
			<div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-800">
				<div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
					Начальная точка
				</div>

				<div className="grid grid-cols-2 gap-2">
					<div className="space-y-2">
						<label className="text-sm text-gray-600 dark:text-gray-400">
							X (м)
						</label>
						<Input
							type="number"
							value={dimension.startPoint.x.toFixed(3)}
							onChange={(e) => {
								const x = parseFloat(e.target.value) || 0;
								dispatch({
									type: "UPDATE_DIMENSION",
									id: dimension.id,
									updates: {
										startPoint: { ...dimension.startPoint, x },
									},
								});
							}}
							step="0.01"
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm text-gray-600 dark:text-gray-400">
							Y (м)
						</label>
						<Input
							type="number"
							value={dimension.startPoint.y.toFixed(3)}
							onChange={(e) => {
								const y = parseFloat(e.target.value) || 0;
								dispatch({
									type: "UPDATE_DIMENSION",
									id: dimension.id,
									updates: {
										startPoint: { ...dimension.startPoint, y },
									},
								});
							}}
							step="0.01"
						/>
					</div>
				</div>
			</div>

			{/* Конечная точка */}
			<div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-800">
				<div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
					Конечная точка
				</div>

				<div className="grid grid-cols-2 gap-2">
					<div className="space-y-2">
						<label className="text-sm text-gray-600 dark:text-gray-400">
							X (м)
						</label>
						<Input
							type="number"
							value={dimension.endPoint.x.toFixed(3)}
							onChange={(e) => {
								const x = parseFloat(e.target.value) || 0;
								dispatch({
									type: "UPDATE_DIMENSION",
									id: dimension.id,
									updates: {
										endPoint: { ...dimension.endPoint, x },
									},
								});
							}}
							step="0.01"
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm text-gray-600 dark:text-gray-400">
							Y (м)
						</label>
						<Input
							type="number"
							value={dimension.endPoint.y.toFixed(3)}
							onChange={(e) => {
								const y = parseFloat(e.target.value) || 0;
								dispatch({
									type: "UPDATE_DIMENSION",
									id: dimension.id,
									updates: {
										endPoint: { ...dimension.endPoint, y },
									},
								});
							}}
							step="0.01"
						/>
					</div>
				</div>
			</div>

			{/* Информация */}
			<div className="pt-2 border-t border-gray-200 dark:border-gray-800">
				<div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
					<div>
						ID: <span className="font-mono">{dimension.id}</span>
					</div>
					<div>
						Слой:{" "}
						<span className="font-medium">
							{state.layers.get(dimension.layerId)?.name || "Неизвестно"}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}

// Свойства комнаты
function RoomProperties() {
	const { state, dispatch } = useEditor();
	const room = state.rooms.get(state.selection.id!);

	if (!room) return null;

	// Безопасные значения по умолчанию
	const roomSize = room.size || { width: 3, height: 3 };
	const roomRotation = room.rotation ?? 0;

	return (
		<div className="space-y-4">
			<h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">
				Комната
			</h4>

			{/* Основные параметры */}
			<div className="space-y-3">
				<div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
					Основные параметры
				</div>

				<div className="space-y-2">
					<label className="text-sm text-gray-600 dark:text-gray-400">
						Название
					</label>
					<Input
						type="text"
						value={room.name || ""}
						onChange={(e) => {
							dispatch({
								type: "UPDATE_ROOM",
								id: room.id,
								updates: { name: e.target.value },
							});
						}}
						placeholder="Название комнаты"
					/>
				</div>

				<div className="grid grid-cols-2 gap-2">
					<div className="space-y-2">
						<label className="text-sm text-gray-600 dark:text-gray-400">
							Ширина (м)
						</label>
						<Input
							type="number"
							value={roomSize.width.toFixed(2)}
							onChange={(e) => {
								const width = parseFloat(e.target.value) || 0;
								if (width > 0) {
									dispatch({
										type: "UPDATE_ROOM",
										id: room.id,
										updates: {
											size: { ...roomSize, width },
										},
									});
								}
							}}
							step="0.1"
							min="0.1"
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm text-gray-600 dark:text-gray-400">
							Высота (м)
						</label>
						<Input
							type="number"
							value={roomSize.height.toFixed(2)}
							onChange={(e) => {
								const height = parseFloat(e.target.value) || 0;
								if (height > 0) {
									dispatch({
										type: "UPDATE_ROOM",
										id: room.id,
										updates: {
											size: { ...roomSize, height },
										},
									});
								}
							}}
							step="0.1"
							min="0.1"
						/>
					</div>
				</div>

				<div className="space-y-2">
					<label className="text-sm text-gray-600 dark:text-gray-400">
						Угол поворота (°)
					</label>
					<Input
						type="number"
						value={roomRotation.toFixed(1)}
						onChange={(e) => {
							const rotation = parseFloat(e.target.value) || 0;
							dispatch({
								type: "UPDATE_ROOM",
								id: room.id,
								updates: { rotation },
							});
						}}
						step="1"
					/>
				</div>
			</div>

			{/* Позиция */}
			<div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-800">
				<div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
					Позиция
				</div>

				<div className="grid grid-cols-2 gap-2">
					<div className="space-y-2">
						<label className="text-sm text-gray-600 dark:text-gray-400">
							X (м)
						</label>
						<Input
							type="number"
							value={room.position.x.toFixed(3)}
							onChange={(e) => {
								const x = parseFloat(e.target.value) || 0;
								dispatch({
									type: "UPDATE_ROOM",
									id: room.id,
									updates: { position: { ...room.position, x } },
								});
							}}
							step="0.01"
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm text-gray-600 dark:text-gray-400">
							Y (м)
						</label>
						<Input
							type="number"
							value={room.position.y.toFixed(3)}
							onChange={(e) => {
								const y = parseFloat(e.target.value) || 0;
								dispatch({
									type: "UPDATE_ROOM",
									id: room.id,
									updates: { position: { ...room.position, y } },
								});
							}}
							step="0.01"
						/>
					</div>
				</div>
			</div>

			{/* Пол комнаты */}
			<div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-800">
				<div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
					Пол комнаты
				</div>

				{/* Режим заливки */}
				<div className="space-y-2">
					<label className="text-sm text-gray-600 dark:text-gray-400">
						Режим заливки
					</label>
					<select
						value={room.floorFillMode ?? "color"}
						onChange={(e) => {
							dispatch({
								type: "UPDATE_ROOM",
								id: room.id,
								updates: {
									floorFillMode: e.target.value as "color" | "texture",
								},
							});
						}}
						className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
					>
						<option value="color">Цвет</option>
						<option value="texture">Текстура</option>
					</select>
				</div>

				{/* Цвет пола */}
				{room.floorFillMode !== "texture" && (
					<div className="space-y-2">
						<label className="text-sm text-gray-600 dark:text-gray-400">
							Цвет пола
						</label>
						<div className="flex gap-2">
							<Input
								type="color"
								value={room.floorColor ?? "#3b82f6"}
								onChange={(e) => {
									dispatch({
										type: "UPDATE_ROOM",
										id: room.id,
										updates: { floorColor: e.target.value },
									});
								}}
								className="w-16 h-10 p-1 border border-gray-300 dark:border-gray-700 rounded-md cursor-pointer"
							/>
							<Input
								type="text"
								value={room.floorColor ?? "#3b82f6"}
								onChange={(e) => {
									dispatch({
										type: "UPDATE_ROOM",
										id: room.id,
										updates: { floorColor: e.target.value },
									});
								}}
								placeholder="#3b82f6"
								className="flex-1"
							/>
						</div>
					</div>
				)}

				{/* Текстура пола */}
				{room.floorFillMode === "texture" && (
					<>
						<div className="space-y-2">
							<label className="text-sm text-gray-600 dark:text-gray-400">
								Текстура пола
							</label>
							<div className="flex gap-2">
								<Input
									type="file"
									accept="image/*"
									onChange={(e) => {
										const file = e.target.files?.[0];
										if (file) {
											const url = URL.createObjectURL(file);
											dispatch({
												type: "UPDATE_ROOM",
												id: room.id,
												updates: {
													floorTexture: url,
													floorFillMode: "texture",
												},
											});
										}
									}}
									className="flex-1 text-sm"
								/>
								{room.floorTexture && (
									<button
										type="button"
										onClick={() => {
											// Освобождаем blob URL
											if (room.floorTexture?.startsWith("blob:")) {
												URL.revokeObjectURL(room.floorTexture);
											}
											dispatch({
												type: "UPDATE_ROOM",
												id: room.id,
												updates: {
													floorTexture: null,
													floorFillMode: "color",
												},
											});
										}}
										className="px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
									>
										Удалить
									</button>
								)}
							</div>
							{room.floorTexture && (
								<div className="mt-2">
									<img
										src={room.floorTexture}
										alt="Предпросмотр текстуры"
										className="w-full h-24 object-cover rounded-md border border-gray-300 dark:border-gray-700"
									/>
								</div>
							)}
						</div>

						{/* Масштаб текстуры */}
						{room.floorTexture && (
							<div className="grid grid-cols-2 gap-2">
								<div className="space-y-2">
									<label className="text-sm text-gray-600 dark:text-gray-400">
										Масштаб X
									</label>
									<Input
										type="number"
										value={room.floorTextureScale?.x ?? 1}
										onChange={(e) => {
											const scaleX = parseFloat(e.target.value) || 1;
											dispatch({
												type: "UPDATE_ROOM",
												id: room.id,
												updates: {
													floorTextureScale: {
														x: scaleX,
														y: room.floorTextureScale?.y ?? 1,
													},
												},
											});
										}}
										step="0.1"
										min="0.1"
									/>
								</div>
								<div className="space-y-2">
									<label className="text-sm text-gray-600 dark:text-gray-400">
										Масштаб Y
									</label>
									<Input
										type="number"
										value={room.floorTextureScale?.y ?? 1}
										onChange={(e) => {
											const scaleY = parseFloat(e.target.value) || 1;
											dispatch({
												type: "UPDATE_ROOM",
												id: room.id,
												updates: {
													floorTextureScale: {
														x: room.floorTextureScale?.x ?? 1,
														y: scaleY,
													},
												},
											});
										}}
										step="0.1"
										min="0.1"
									/>
								</div>
							</div>
						)}
					</>
				)}
			</div>

			{/* Потолок комнаты */}
			<div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-800">
				<div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
					Потолок комнаты
				</div>

				{/* Режим заливки */}
				<div className="space-y-2">
					<label className="text-sm text-gray-600 dark:text-gray-400">
						Тип потолка
					</label>
					<select
						value={room.ceilingFillMode ?? "color"}
						onChange={(e) => {
							dispatch({
								type: "UPDATE_ROOM",
								id: room.id,
								updates: {
									ceilingFillMode: e.target.value as
										| "color"
										| "texture"
										| "light",
								},
							});
						}}
						className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
					>
						<option value="color">Цвет</option>
						<option value="texture">Текстура</option>
						<option value="light">Светящийся</option>
					</select>
				</div>

				{/* Цвет потолка */}
				{room.ceilingFillMode !== "texture" && (
					<div className="space-y-2">
						<label className="text-sm text-gray-600 dark:text-gray-400">
							Цвет потолка
						</label>
						<div className="flex gap-2">
							<Input
								type="color"
								value={room.ceilingColor ?? "#f3f4f6"}
								onChange={(e) => {
									dispatch({
										type: "UPDATE_ROOM",
										id: room.id,
										updates: { ceilingColor: e.target.value },
									});
								}}
								className="w-16 h-10 p-1 border border-gray-300 dark:border-gray-700 rounded-md cursor-pointer"
							/>
							<Input
								type="text"
								value={room.ceilingColor ?? "#f3f4f6"}
								onChange={(e) => {
									dispatch({
										type: "UPDATE_ROOM",
										id: room.id,
										updates: { ceilingColor: e.target.value },
									});
								}}
								placeholder="#f3f4f6"
								className="flex-1"
							/>
						</div>
					</div>
				)}

				{/* Текстура потолка */}
				{room.ceilingFillMode === "texture" && (
					<>
						<div className="space-y-2">
							<label className="text-sm text-gray-600 dark:text-gray-400">
								Текстура потолка
							</label>
							<div className="flex gap-2">
								<Input
									type="file"
									accept="image/*"
									onChange={(e) => {
										const file = e.target.files?.[0];
										if (file) {
											const url = URL.createObjectURL(file);
											dispatch({
												type: "UPDATE_ROOM",
												id: room.id,
												updates: {
													ceilingTexture: url,
													ceilingFillMode: "texture",
												},
											});
										}
									}}
									className="flex-1 text-sm"
								/>
								{room.ceilingTexture && (
									<button
										type="button"
										onClick={() => {
											// Освобождаем blob URL
											if (room.ceilingTexture?.startsWith("blob:")) {
												URL.revokeObjectURL(room.ceilingTexture);
											}
											dispatch({
												type: "UPDATE_ROOM",
												id: room.id,
												updates: {
													ceilingTexture: null,
													ceilingFillMode: "color",
												},
											});
										}}
										className="px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
									>
										Удалить
									</button>
								)}
							</div>
							{room.ceilingTexture && (
								<div className="mt-2">
									<img
										src={room.ceilingTexture}
										alt="Предпросмотр текстуры потолка"
										className="w-full h-24 object-cover rounded-md border border-gray-300 dark:border-gray-700"
									/>
								</div>
							)}
						</div>

						{/* Масштаб текстуры потолка */}
						{room.ceilingTexture && (
							<div className="grid grid-cols-2 gap-2">
								<div className="space-y-2">
									<label className="text-sm text-gray-600 dark:text-gray-400">
										Масштаб X
									</label>
									<Input
										type="number"
										value={room.ceilingTextureScale?.x ?? 1}
										onChange={(e) => {
											const scaleX = parseFloat(e.target.value) || 1;
											dispatch({
												type: "UPDATE_ROOM",
												id: room.id,
												updates: {
													ceilingTextureScale: {
														x: scaleX,
														y: room.ceilingTextureScale?.y ?? 1,
													},
												},
											});
										}}
										step="0.1"
										min="0.1"
									/>
								</div>
								<div className="space-y-2">
									<label className="text-sm text-gray-600 dark:text-gray-400">
										Масштаб Y
									</label>
									<Input
										type="number"
										value={room.ceilingTextureScale?.y ?? 1}
										onChange={(e) => {
											const scaleY = parseFloat(e.target.value) || 1;
											dispatch({
												type: "UPDATE_ROOM",
												id: room.id,
												updates: {
													ceilingTextureScale: {
														x: room.ceilingTextureScale?.x ?? 1,
														y: scaleY,
													},
												},
											});
										}}
										step="0.1"
										min="0.1"
									/>
								</div>
							</div>
						)}
					</>
				)}

				{/* Интенсивность света для светящегося потолка */}
				{room.ceilingFillMode === "light" && (
					<div className="space-y-2">
						<label className="text-sm text-gray-600 dark:text-gray-400">
							Интенсивность света: {room.ceilingLightIntensity ?? 0}
						</label>
						<Input
							type="range"
							min="0"
							max="5"
							step="0.1"
							value={room.ceilingLightIntensity ?? 0}
							onChange={(e) => {
								dispatch({
									type: "UPDATE_ROOM",
									id: room.id,
									updates: {
										ceilingLightIntensity: parseFloat(e.target.value) || 0,
									},
								});
							}}
							className="w-full"
						/>
						<div className="text-xs text-gray-500 dark:text-gray-400">
							Диапазон: 0 (нет свечения) - 5 (максимальная яркость)
						</div>
					</div>
				)}
			</div>

			{/* Информация */}
			<div className="pt-2 border-t border-gray-200 dark:border-gray-800">
				<div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
					<div>
						ID: <span className="font-mono">{room.id}</span>
					</div>
					<div>
						Слой:{" "}
						<span className="font-medium">
							{state.layers.get(room.layerId)?.name || "Неизвестно"}
						</span>
					</div>
					{roomSize && (
						<div>
							Площадь:{" "}
							<span className="font-medium">
								{(roomSize.width * roomSize.height).toFixed(2)} м²
							</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

// Настройки плана и сетки
function PlanSettings() {
	const { state, dispatch } = useEditor();

	return (
		<div className="space-y-6">
			{/* Настройки плана */}
			<div className="space-y-3">
				<h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">
					План
				</h4>

				<div className="space-y-2">
					<label className="text-sm text-gray-600 dark:text-gray-400">
						Единицы измерения
					</label>
					<select
						value={state.planSettings.units}
						className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md text-sm"
						disabled
					>
						<option value="meters">Метры</option>
						<option value="millimeters">Миллиметры</option>
					</select>
				</div>
			</div>

			{/* Настройки сетки */}
			<div className="space-y-3">
				<h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">
					Сетка
				</h4>

				<div className="flex items-center gap-2">
					<input
						type="checkbox"
						id="grid-visible"
						checked={state.gridSettings.visible}
						onChange={(e) => {
							dispatch({
								type: "SET_CAMERA",
								camera: state.camera,
							});
						}}
						className="w-4 h-4"
						disabled
					/>
					<label
						htmlFor="grid-visible"
						className="text-sm text-gray-600 dark:text-gray-400"
					>
						Показать сетку
					</label>
				</div>

				<div className="space-y-2">
					<label className="text-sm text-gray-600 dark:text-gray-400">
						Шаг сетки (м)
					</label>
					<Input
						type="number"
						value={state.gridSettings.spacing}
						step="0.1"
						readOnly
					/>
				</div>

				<div className="text-xs text-gray-500 dark:text-gray-400">
					Сетка адаптируется автоматически при изменении масштаба
				</div>
			</div>

			{/* Информация */}
			<div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-800">
				<div className="text-xs text-gray-500 dark:text-gray-400">
					<div className="flex justify-between py-1">
						<span>Масштаб:</span>
						<span className="font-medium">
							{Math.round((state.camera.zoom / 50) * 100)}%
						</span>
					</div>
					<div className="flex justify-between py-1">
						<span>Объектов:</span>
						<span className="font-medium">
							{state.walls.size +
								state.doors.size +
								state.windows.size +
								state.nodes.size}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}

// Панель слоёв (как в Figma)
function LayersPanel() {
	const { state, setSelection, dispatch } = useEditor();
	const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
		new Set([
			"walls",
			"doors",
			"windows",
			"nodes",
			"rooms",
			"furniture",
			"dimensions",
		])
	);

	// Маппинг групп на слои
	const groupToLayers: Record<string, string[]> = {
		walls: ["layer-walls"],
		doors: ["layer-openings"],
		windows: ["layer-openings"],
		nodes: ["layer-walls"], // Узлы обычно на слое стен
		rooms: ["layer-rooms"],
		furniture: ["layer-furniture"],
		dimensions: ["layer-dimensions"],
	};

	// Проверка видимости группы
	const isGroupVisible = (group: string): boolean => {
		const layerIds = groupToLayers[group] || [];
		for (const layerId of layerIds) {
			const layer = state.layers.get(layerId);
			if (layer && layer.visible) {
				return true;
			}
		}
		return false;
	};

	// Переключение видимости группы
	const toggleGroupVisibility = (group: string, e: React.MouseEvent) => {
		e.stopPropagation();
		const layerIds = groupToLayers[group] || [];
		const shouldBeVisible = !isGroupVisible(group);

		for (const layerId of layerIds) {
			const layer = state.layers.get(layerId);
			if (layer) {
				dispatch({
					type: "UPDATE_LAYER",
					id: layerId,
					updates: { visible: shouldBeVisible },
				});
			}
		}
	};

	const toggleGroup = (group: string) => {
		const newExpanded = new Set(expandedGroups);
		if (newExpanded.has(group)) {
			newExpanded.delete(group);
		} else {
			newExpanded.add(group);
		}
		setExpandedGroups(newExpanded);
	};

	const handleObjectClick = (
		type:
			| "node"
			| "wall"
			| "door"
			| "window"
			| "room"
			| "furniture"
			| "dimension",
		id: string
	) => {
		setSelection(type, id);
	};

	const walls = Array.from(state.walls.values());
	const doors = Array.from(state.doors.values());
	const windows = Array.from(state.windows.values());
	const nodes = Array.from(state.nodes.values());
	const rooms = Array.from(state.rooms.values());
	const furniture = Array.from(state.furniture.values());
	const dimensions = Array.from(state.dimensions.values());

	return (
		<div className="flex-1 flex flex-col overflow-hidden">
			{/* Список объектов */}
			<div className="flex-1 overflow-y-auto p-2">
				<div className="space-y-1">
					{/* Стены */}
					{walls.length > 0 && (
						<div>
							<button
								onClick={() => toggleGroup("walls")}
								className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
							>
								<ChevronRight
									size={14}
									className={`transition-transform ${
										expandedGroups.has("walls") ? "rotate-90" : ""
									}`}
								/>
								<button
									onClick={(e) => toggleGroupVisibility("walls", e)}
									className="flex items-center justify-center w-5 h-5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
									title={
										isGroupVisible("walls")
											? "Скрыть все стены"
											: "Показать все стены"
									}
								>
									{isGroupVisible("walls") ? (
										<Eye size={14} />
									) : (
										<EyeOff size={14} className="text-gray-400" />
									)}
								</button>
								<Square size={14} />
								<span>Стены ({walls.length})</span>
							</button>
							{expandedGroups.has("walls") && (
								<div className="ml-4 mt-1 space-y-0.5">
									{walls.map((wall, index) => (
										<LayerItem
											key={wall.id}
											icon={<Square size={14} />}
											label={`Стена ${index + 1}`}
											isSelected={
												state.selection.type === "wall" &&
												state.selection.id === wall.id
											}
											onClick={() => handleObjectClick("wall", wall.id)}
										/>
									))}
								</div>
							)}
						</div>
					)}

					{/* Двери */}
					{doors.length > 0 && (
						<div>
							<button
								onClick={() => toggleGroup("doors")}
								className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
							>
								<ChevronRight
									size={14}
									className={`transition-transform ${
										expandedGroups.has("doors") ? "rotate-90" : ""
									}`}
								/>
								<button
									onClick={(e) => toggleGroupVisibility("doors", e)}
									className="flex items-center justify-center w-5 h-5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
									title={
										isGroupVisible("doors")
											? "Скрыть все двери"
											: "Показать все двери"
									}
								>
									{isGroupVisible("doors") ? (
										<Eye size={14} />
									) : (
										<EyeOff size={14} className="text-gray-400" />
									)}
								</button>
								<DoorOpen size={14} />
								<span>Двери ({doors.length})</span>
							</button>
							{expandedGroups.has("doors") && (
								<div className="ml-4 mt-1 space-y-0.5">
									{doors.map((door, index) => (
										<LayerItem
											key={door.id}
											icon={<DoorOpen size={14} />}
											label={`Дверь ${index + 1}`}
											isSelected={
												state.selection.type === "door" &&
												state.selection.id === door.id
											}
											onClick={() => handleObjectClick("door", door.id)}
										/>
									))}
								</div>
							)}
						</div>
					)}

					{/* Окна */}
					{windows.length > 0 && (
						<div>
							<button
								onClick={() => toggleGroup("windows")}
								className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
							>
								<ChevronRight
									size={14}
									className={`transition-transform ${
										expandedGroups.has("windows") ? "rotate-90" : ""
									}`}
								/>
								<SquareDashedBottom size={14} />
								<span>Окна ({windows.length})</span>
							</button>
							{expandedGroups.has("windows") && (
								<div className="ml-4 mt-1 space-y-0.5">
									{windows.map((window, index) => (
										<LayerItem
											key={window.id}
											icon={<SquareDashedBottom size={14} />}
											label={`Окно ${index + 1}`}
											isSelected={
												state.selection.type === "window" &&
												state.selection.id === window.id
											}
											onClick={() => handleObjectClick("window", window.id)}
										/>
									))}
								</div>
							)}
						</div>
					)}

					{/* Узлы */}
					{nodes.length > 0 && (
						<div>
							<button
								onClick={() => toggleGroup("nodes")}
								className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
							>
								<ChevronRight
									size={14}
									className={`transition-transform ${
										expandedGroups.has("nodes") ? "rotate-90" : ""
									}`}
								/>
								<button
									onClick={(e) => toggleGroupVisibility("nodes", e)}
									className="flex items-center justify-center w-5 h-5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
									title={
										isGroupVisible("nodes")
											? "Скрыть все узлы"
											: "Показать все узлы"
									}
								>
									{isGroupVisible("nodes") ? (
										<Eye size={14} />
									) : (
										<EyeOff size={14} className="text-gray-400" />
									)}
								</button>
								<Circle size={14} />
								<span>Узлы ({nodes.length})</span>
							</button>
							{expandedGroups.has("nodes") && (
								<div className="ml-4 mt-1 space-y-0.5">
									{nodes.map((node, index) => (
										<LayerItem
											key={node.id}
											icon={<Circle size={14} />}
											label={`Узел ${index + 1}`}
											isSelected={
												state.selection.type === "node" &&
												state.selection.id === node.id
											}
											onClick={() => handleObjectClick("node", node.id)}
										/>
									))}
								</div>
							)}
						</div>
					)}

					{/* Комнаты */}
					{rooms.length > 0 && (
						<div>
							<button
								onClick={() => toggleGroup("rooms")}
								className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
							>
								<ChevronRight
									size={14}
									className={`transition-transform ${
										expandedGroups.has("rooms") ? "rotate-90" : ""
									}`}
								/>
								<button
									onClick={(e) => toggleGroupVisibility("rooms", e)}
									className="flex items-center justify-center w-5 h-5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
									title={
										isGroupVisible("rooms")
											? "Скрыть все комнаты"
											: "Показать все комнаты"
									}
								>
									{isGroupVisible("rooms") ? (
										<Eye size={14} />
									) : (
										<EyeOff size={14} className="text-gray-400" />
									)}
								</button>
								<Square size={14} />
								<span>Комнаты ({rooms.length})</span>
							</button>
							{expandedGroups.has("rooms") && (
								<div className="ml-4 mt-1 space-y-0.5">
									{rooms.map((room, index) => (
										<LayerItem
											key={room.id}
											icon={<Square size={14} />}
											label={room.name || `Комната ${index + 1}`}
											isSelected={
												state.selection.type === "room" &&
												state.selection.id === room.id
											}
											onClick={() => handleObjectClick("room", room.id)}
										/>
									))}
								</div>
							)}
						</div>
					)}

					{/* Мебель */}
					{furniture.length > 0 && (
						<div>
							<button
								onClick={() => toggleGroup("furniture")}
								className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
							>
								<ChevronRight
									size={14}
									className={`transition-transform ${
										expandedGroups.has("furniture") ? "rotate-90" : ""
									}`}
								/>
								<button
									onClick={(e) => toggleGroupVisibility("furniture", e)}
									className="flex items-center justify-center w-5 h-5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
									title={
										isGroupVisible("furniture")
											? "Скрыть всю мебель"
											: "Показать всю мебель"
									}
								>
									{isGroupVisible("furniture") ? (
										<Eye size={14} />
									) : (
										<EyeOff size={14} className="text-gray-400" />
									)}
								</button>
								<Armchair size={14} />
								<span>Мебель ({furniture.length})</span>
							</button>
							{expandedGroups.has("furniture") && (
								<div className="ml-4 mt-1 space-y-0.5">
									{furniture.map((item, index) => (
										<LayerItem
											key={item.id}
											icon={<Square size={14} />}
											label={item.type || `Мебель ${index + 1}`}
											isSelected={
												state.selection.type === "furniture" &&
												state.selection.id === item.id
											}
											onClick={() => handleObjectClick("furniture", item.id)}
										/>
									))}
								</div>
							)}
						</div>
					)}

					{/* Размеры */}
					{dimensions.length > 0 && (
						<div>
							<button
								onClick={() => toggleGroup("dimensions")}
								className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
							>
								<ChevronRight
									size={14}
									className={`transition-transform ${
										expandedGroups.has("dimensions") ? "rotate-90" : ""
									}`}
								/>
								<button
									onClick={(e) => toggleGroupVisibility("dimensions", e)}
									className="flex items-center justify-center w-5 h-5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
									title={
										isGroupVisible("dimensions")
											? "Скрыть все размеры"
											: "Показать все размеры"
									}
								>
									{isGroupVisible("dimensions") ? (
										<Eye size={14} />
									) : (
										<EyeOff size={14} className="text-gray-400" />
									)}
								</button>
								<Square size={14} />
								<span>Размеры ({dimensions.length})</span>
							</button>
							{expandedGroups.has("dimensions") && (
								<div className="ml-4 mt-1 space-y-0.5">
									{dimensions.map((dimension, index) => (
										<LayerItem
											key={dimension.id}
											icon={<Square size={14} />}
											label={`Размер ${index + 1}`}
											isSelected={
												state.selection.type === "dimension" &&
												state.selection.id === dimension.id
											}
											onClick={() =>
												handleObjectClick("dimension", dimension.id)
											}
										/>
									))}
								</div>
							)}
						</div>
					)}

					{/* Пустое состояние */}
					{walls.length === 0 &&
						doors.length === 0 &&
						windows.length === 0 &&
						nodes.length === 0 &&
						rooms.length === 0 &&
						furniture.length === 0 &&
						dimensions.length === 0 && (
							<div className="flex items-center justify-center h-32 text-sm text-gray-500 dark:text-gray-400"></div>
						)}
				</div>
			</div>
		</div>
	);
}

// Компонент элемента в списке слоёв
interface LayerItemProps {
	icon: React.ReactNode;
	label: string;
	isSelected: boolean;
	onClick: () => void;
}

function LayerItem({ icon, label, isSelected, onClick }: LayerItemProps) {
	return (
		<button
			onClick={onClick}
			className={`
        w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors
        ${
					isSelected
						? "bg-blue-600 text-white"
						: "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
				}
      `}
		>
			<span
				className={
					isSelected ? "text-white" : "text-gray-500 dark:text-gray-400"
				}
			>
				{icon}
			</span>
			<span className="flex-1 text-left truncate">{label}</span>
		</button>
	);
}
