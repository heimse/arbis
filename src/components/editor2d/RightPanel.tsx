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
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import type { Node, Wall, Door, Window } from "@/types/editor";

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
	}, [state.selection.id, state.selection.type, activeTab]);

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
				<TabsList className="w-full grid grid-cols-3 gap-0 bg-gray-50 dark:bg-gray-800 rounded-none border-b border-gray-200 dark:border-gray-700 shrink-0">
					<TabsTrigger
						value="properties"
						className="rounded-none data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900"
					>
						Свойства
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

function DoorProperties() {
	const { state, dispatch } = useEditor();
	const door = state.doors.get(state.selection.id!);

	if (!door) return null;

	const wall = state.walls.get(door.wallId);
	if (!wall) return null;

	const startNode = state.nodes.get(wall.startNodeId);
	const endNode = state.nodes.get(wall.endNodeId);
	if (!startNode || !endNode) return null;

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
						Направление открывания
					</label>
					<select
						value={door.openDirection}
						onChange={(e) => {
							dispatch({
								type: "UPDATE_DOOR",
								id: door.id,
								updates: { openDirection: e.target.value as "left" | "right" },
							});
						}}
						className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md text-sm"
					>
						<option value="left">Влево</option>
						<option value="right">Вправо</option>
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
		new Set(["walls", "doors", "windows", "nodes"])
	);

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
		type: "node" | "wall" | "door" | "window",
		id: string
	) => {
		setSelection(type, id);
	};

	const walls = Array.from(state.walls.values());
	const doors = Array.from(state.doors.values());
	const windows = Array.from(state.windows.values());
	const nodes = Array.from(state.nodes.values());

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

					{/* Пустое состояние */}
					{walls.length === 0 &&
						doors.length === 0 &&
						windows.length === 0 &&
						nodes.length === 0 && (
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
