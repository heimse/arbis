"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEditor2DStore } from "@/store/editor2dStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image, Settings, Layers } from "lucide-react";
import { LayersPanelFigma } from "./LayersPanelFigma";
import { defaultFloorMaterials } from "@/lib/editor/rooms";
import type { RoomType, FloorMaterial } from "@/types/plan";

/**
 * Панель свойств для редактирования выбранного объекта
 */
export function Editor2DPropertiesPanel() {
	const {
		plan,
		selectedId,
		selectedType,
		updateRoom,
		updateFurniture,
		setRealWorldSize,
		setBackgroundImage,
		updateBackgroundImage,
		setBackgroundOpacity,
	} = useEditor2DStore();

	const [bgUrl, setBgUrl] = React.useState("");
	const [bgScale, setBgScale] = React.useState("1");
	const [bgOffsetX, setBgOffsetX] = React.useState("0");
	const [bgOffsetY, setBgOffsetY] = React.useState("0");

	// Находим выбранный объект
	const selectedRoom =
		selectedType === "room"
			? plan.rooms.find((r) => r.id === selectedId)
			: null;
	const selectedFurniture =
		selectedType === "furniture"
			? plan.furniture.find((f) => f.id === selectedId)
			: null;

	// Обработчики изменения свойств комнаты
	const handleRoomNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (selectedRoom) {
			updateRoom(selectedRoom.id, { name: e.target.value });
		}
	};

	const handleRoomTypeChange = (value: RoomType) => {
		if (selectedRoom) {
			updateRoom(selectedRoom.id, { roomType: value });
		}
	};

	const handleFloorMaterialChange = (materialId: string) => {
		if (selectedRoom) {
			const material = defaultFloorMaterials.find((m) => m.id === materialId);
			if (material) {
				updateRoom(selectedRoom.id, { floorMaterial: material });
			}
		}
	};

	const handleFloorLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (selectedRoom) {
			const level = parseFloat(e.target.value);
			if (!isNaN(level)) {
				updateRoom(selectedRoom.id, { floorLevel: level });
			}
		}
	};

	const handleLayerChange = (layerId: string) => {
		if (selectedRoom) {
			updateRoom(selectedRoom.id, { layerId });
		}
	};

	// Обработчики изменения свойств мебели
	const handleFurnitureTypeChange = (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		if (selectedFurniture) {
			updateFurniture(selectedFurniture.id, { type: e.target.value });
		}
	};

	const handleFurnitureWidthChange = (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		if (selectedFurniture) {
			const width = parseFloat(e.target.value);
			if (!isNaN(width) && width > 0) {
				updateFurniture(selectedFurniture.id, {
					size: { ...selectedFurniture.size, width },
				});
			}
		}
	};

	const handleFurnitureHeightChange = (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		if (selectedFurniture) {
			const height = parseFloat(e.target.value);
			if (!isNaN(height) && height > 0) {
				updateFurniture(selectedFurniture.id, {
					size: { ...selectedFurniture.size, height },
				});
			}
		}
	};

	// Обработчики для настроек плана
	const handleRealWorldWidthChange = (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		const widthMeters = parseFloat(e.target.value);
		if (!isNaN(widthMeters) && widthMeters > 0 && plan.realWorldSize) {
			setRealWorldSize({
				...plan.realWorldSize,
				widthMeters,
			});
		}
	};

	const handleRealWorldHeightChange = (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		const heightMeters = parseFloat(e.target.value);
		if (!isNaN(heightMeters) && heightMeters > 0 && plan.realWorldSize) {
			setRealWorldSize({
				...plan.realWorldSize,
				heightMeters,
			});
		}
	};

	const handlePixelsPerMeterChange = (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		const pixelsPerMeter = parseFloat(e.target.value);
		if (!isNaN(pixelsPerMeter) && pixelsPerMeter > 0 && plan.realWorldSize) {
			setRealWorldSize({
				...plan.realWorldSize,
				pixelsPerMeter,
			});
		}
	};

	const handleAddBackgroundImage = () => {
		if (bgUrl.trim()) {
			setBackgroundImage({
				url: bgUrl.trim(),
				opacity: 0.5,
				scale: parseFloat(bgScale) || 1,
				offset: {
					x: parseFloat(bgOffsetX) || 0,
					y: parseFloat(bgOffsetY) || 0,
				},
				visible: true,
			});
		}
	};

	const handleRemoveBackgroundImage = () => {
		setBackgroundImage(undefined);
		setBgUrl("");
	};

	const handleBackgroundOpacityChange = (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		const opacity = parseFloat(e.target.value);
		if (!isNaN(opacity)) {
			setBackgroundOpacity(opacity);
		}
	};

	const handleBackgroundScaleChange = (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		const scale = parseFloat(e.target.value);
		if (!isNaN(scale) && scale > 0) {
			updateBackgroundImage({ scale });
		}
	};

	const handleBackgroundOffsetXChange = (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		const x = parseFloat(e.target.value);
		if (!isNaN(x) && plan.backgroundImage) {
			updateBackgroundImage({
				offset: { ...plan.backgroundImage.offset, x },
			});
		}
	};

	const handleBackgroundOffsetYChange = (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		const y = parseFloat(e.target.value);
		if (!isNaN(y) && plan.backgroundImage) {
			updateBackgroundImage({
				offset: { ...plan.backgroundImage.offset, y },
			});
		}
	};

	// Если ничего не выбрано, показываем настройки плана
	if (!selectedId || !selectedType) {
		return (
			<div className="w-80 border-l bg-muted/40 p-4">
				<Tabs defaultValue="layers" className="w-full">
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="layers">
							<Layers className="h-4 w-4 mr-2" />
							Слои
						</TabsTrigger>
						<TabsTrigger value="plan">
							<Settings className="h-4 w-4 mr-2" />
							План
						</TabsTrigger>
						<TabsTrigger value="background">
							<Image className="h-4 w-4 mr-2" />
							Фон
						</TabsTrigger>
					</TabsList>

					<TabsContent value="layers" className="space-y-4 h-full">
						<LayersPanelFigma />
					</TabsContent>

					<TabsContent value="plan" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle className="text-base">Реальные размеры</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<label className="text-sm font-medium">Ширина (м)</label>
									<Input
										type="number"
										value={plan.realWorldSize?.widthMeters || 12.5}
										onChange={handleRealWorldWidthChange}
										className="mt-1.5"
										min="0"
										step="0.1"
									/>
								</div>
								<div>
									<label className="text-sm font-medium">Высота (м)</label>
									<Input
										type="number"
										value={plan.realWorldSize?.heightMeters || 12}
										onChange={handleRealWorldHeightChange}
										className="mt-1.5"
										min="0"
										step="0.1"
									/>
								</div>
								<div>
									<label className="text-sm font-medium">
										Пикселей на метр
									</label>
									<Input
										type="number"
										value={plan.realWorldSize?.pixelsPerMeter || 80}
										onChange={handlePixelsPerMeterChange}
										className="mt-1.5"
										min="1"
										step="1"
									/>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="text-base">Информация</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">
									Комнат: {plan.rooms.length}
									<br />
									Мебели: {plan.furniture.length}
								</p>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="background" className="space-y-4">
						{!plan.backgroundImage ? (
							<Card>
								<CardHeader>
									<CardTitle className="text-base">Добавить фон</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div>
										<label className="text-sm font-medium">
											URL изображения
										</label>
										<Input
											type="text"
											value={bgUrl}
											onChange={(e) => setBgUrl(e.target.value)}
											className="mt-1.5"
											placeholder="https://..."
										/>
									</div>
									<div className="grid grid-cols-3 gap-2">
										<div>
											<label className="text-sm font-medium">Масштаб</label>
											<Input
												type="number"
												value={bgScale}
												onChange={(e) => setBgScale(e.target.value)}
												className="mt-1.5"
												step="0.1"
												min="0.1"
											/>
										</div>
										<div>
											<label className="text-sm font-medium">X</label>
											<Input
												type="number"
												value={bgOffsetX}
												onChange={(e) => setBgOffsetX(e.target.value)}
												className="mt-1.5"
												step="10"
											/>
										</div>
										<div>
											<label className="text-sm font-medium">Y</label>
											<Input
												type="number"
												value={bgOffsetY}
												onChange={(e) => setBgOffsetY(e.target.value)}
												className="mt-1.5"
												step="10"
											/>
										</div>
									</div>
									<Button onClick={handleAddBackgroundImage} className="w-full">
										Добавить
									</Button>
								</CardContent>
							</Card>
						) : (
							<>
								<Card>
									<CardHeader>
										<CardTitle className="text-base">Настройки фона</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										<div>
											<label className="text-sm font-medium">
												Прозрачность:{" "}
												{Math.round(plan.backgroundImage.opacity * 100)}%
											</label>
											<Input
												type="range"
												min="0"
												max="1"
												step="0.05"
												value={plan.backgroundImage.opacity}
												onChange={handleBackgroundOpacityChange}
												className="mt-1.5"
											/>
										</div>
										<div>
											<label className="text-sm font-medium">Масштаб</label>
											<Input
												type="number"
												value={plan.backgroundImage.scale}
												onChange={handleBackgroundScaleChange}
												className="mt-1.5"
												step="0.1"
												min="0.1"
											/>
										</div>
										<div className="grid grid-cols-2 gap-2">
											<div>
												<label className="text-sm font-medium">Сдвиг X</label>
												<Input
													type="number"
													value={plan.backgroundImage.offset.x}
													onChange={handleBackgroundOffsetXChange}
													className="mt-1.5"
													step="10"
												/>
											</div>
											<div>
												<label className="text-sm font-medium">Сдвиг Y</label>
												<Input
													type="number"
													value={plan.backgroundImage.offset.y}
													onChange={handleBackgroundOffsetYChange}
													className="mt-1.5"
													step="10"
												/>
											</div>
										</div>
										<Button
											onClick={handleRemoveBackgroundImage}
											variant="destructive"
											className="w-full"
										>
											Удалить фон
										</Button>
									</CardContent>
								</Card>
								<Card>
									<CardHeader>
										<CardTitle className="text-base">URL</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-xs text-muted-foreground break-all">
											{plan.backgroundImage.url}
										</p>
									</CardContent>
								</Card>
							</>
						)}
					</TabsContent>
				</Tabs>
			</div>
		);
	}

	// Если выбрана комната
	if (selectedRoom) {
		const roomTypeLabels: Record<RoomType, string> = {
			bedroom: "Спальня",
			"living-room": "Гостиная",
			kitchen: "Кухня",
			"dining-room": "Столовая",
			bathroom: "Санузел",
			toilet: "Туалет",
			corridor: "Коридор",
			hallway: "Прихожая",
			balcony: "Балкон",
			loggia: "Лоджия",
			storage: "Кладовая",
			technical: "Тех. помещение",
			other: "Другое",
		};

		return (
			<div className="w-80 border-l bg-muted/40 p-4 space-y-4 overflow-y-auto">
				<Tabs defaultValue="object" className="w-full">
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="object">Объект</TabsTrigger>
						<TabsTrigger value="floor">Пол</TabsTrigger>
						<TabsTrigger value="layer">Слой</TabsTrigger>
					</TabsList>

					{/* Вкладка "Объект" */}
					<TabsContent value="object" className="space-y-4 mt-4">
						<Card>
							<CardHeader>
								<CardTitle className="text-base">Объект</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<label
										htmlFor="room-name"
										className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
									>
										Название
									</label>
									<Input
										id="room-name"
										type="text"
										value={selectedRoom.name}
										onChange={handleRoomNameChange}
										className="mt-1.5"
										placeholder="Название комнаты"
									/>
								</div>

								<div>
									<label
										htmlFor="room-type"
										className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
									>
										Назначение
									</label>
									<select
										id="room-type"
										value={selectedRoom.roomType}
										onChange={(e) =>
											handleRoomTypeChange(e.target.value as RoomType)
										}
										className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
									>
										{Object.entries(roomTypeLabels).map(([value, label]) => (
											<option key={value} value={value}>
												{label}
											</option>
										))}
									</select>
								</div>

								<div className="pt-2 border-t">
									<div className="text-sm text-muted-foreground space-y-1">
										<p>
											Площадь:{" "}
											<span className="font-medium">
												{selectedRoom.area.toFixed(2)} м²
											</span>
										</p>
										<p>
											Периметр:{" "}
											<span className="font-medium">
												{selectedRoom.perimeter.toFixed(2)} м
											</span>
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					{/* Вкладка "Пол" */}
					<TabsContent value="floor" className="space-y-4 mt-4">
						<Card>
							<CardHeader>
								<CardTitle className="text-base">Пол</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<label
										htmlFor="floor-material"
										className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
									>
										Материал пола
									</label>
									<select
										id="floor-material"
										value={selectedRoom.floorMaterial?.id || ""}
										onChange={(e) => handleFloorMaterialChange(e.target.value)}
										className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
									>
										<option value="">Выберите материал</option>
										{defaultFloorMaterials.map((material) => (
											<option key={material.id} value={material.id}>
												{material.name}
											</option>
										))}
									</select>
								</div>

								<div>
									<label
										htmlFor="floor-level"
										className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
									>
										Уровень пола (мм)
									</label>
									<Input
										id="floor-level"
										type="number"
										value={selectedRoom.floorLevel}
										onChange={handleFloorLevelChange}
										className="mt-1.5"
										placeholder="0"
									/>
								</div>

								{selectedRoom.floorMaterial && (
									<div className="pt-2 border-t">
										<div className="text-sm text-muted-foreground">
											<p>
												Цвет:{" "}
												<span
													className="inline-block w-4 h-4 rounded align-middle"
													style={{
														backgroundColor: selectedRoom.floorMaterial.color,
													}}
												/>
											</p>
										</div>
									</div>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					{/* Вкладка "Слой" */}
					<TabsContent value="layer" className="space-y-4 mt-4">
						<Card>
							<CardHeader>
								<CardTitle className="text-base">Слой</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<label
										htmlFor="room-layer"
										className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
									>
										Слой
									</label>
									<select
										id="room-layer"
										value={selectedRoom.layerId}
										onChange={(e) => handleLayerChange(e.target.value)}
										className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
									>
										{plan.layers.map((layer) => (
											<option key={layer.id} value={layer.id}>
												{layer.name}
											</option>
										))}
									</select>
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		);
	}

	// Если выбрана мебель
	if (selectedFurniture) {
		return (
			<div className="w-80 border-l bg-muted/40 p-4 space-y-4">
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Свойства мебели</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<label
								htmlFor="furniture-type"
								className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
							>
								Тип
							</label>
							<Input
								id="furniture-type"
								type="text"
								value={selectedFurniture.type}
								onChange={handleFurnitureTypeChange}
								className="mt-1.5"
								placeholder="Тип мебели"
							/>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div>
								<label
									htmlFor="furniture-width"
									className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
								>
									Ширина (см)
								</label>
								<Input
									id="furniture-width"
									type="number"
									value={selectedFurniture.size.width}
									onChange={handleFurnitureWidthChange}
									className="mt-1.5"
									min="0"
									step="10"
								/>
							</div>

							<div>
								<label
									htmlFor="furniture-height"
									className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
								>
									Высота (см)
								</label>
								<Input
									id="furniture-height"
									type="number"
									value={selectedFurniture.size.height}
									onChange={handleFurnitureHeightChange}
									className="mt-1.5"
									min="0"
									step="10"
								/>
							</div>
						</div>

						<div className="pt-2 border-t">
							<div className="text-sm text-muted-foreground">
								<p>
									Позиция: X: {Math.round(selectedFurniture.position.x)}, Y:{" "}
									{Math.round(selectedFurniture.position.y)}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-base">Подсказка</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">
							Перетаскивайте мебель мышью или меняйте размеры в полях выше.
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	return null;
}
