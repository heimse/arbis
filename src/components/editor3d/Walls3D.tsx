"use client";

import { useMemo, memo, useState, useEffect } from "react";
import type { Vector3, Texture } from "three";
import { Vector3 as THREE_Vector3, TextureLoader, RepeatWrapping } from "three";
import type { Wall, Node, Layer, Door, Window } from "@/types/editor";
import { computeWallGeometry, mmToMeters, isLayerVisible } from "./utils3d";
import { buildDoorCutsForWall } from "./Doors3D";
import { buildWindowCutsForWall } from "./Windows3D";
import type { WallCut } from "./Doors3D";

/**
 * Типы объектов в 3D редакторе для userData
 */
export type Editor3DObjectType = "wall";

/**
 * Проверяет, является ли URL валидным для загрузки текстуры
 */
function isValidTextureUrl(url: string | null | undefined): boolean {
	if (!url || typeof url !== "string" || url.trim() === "") {
		return false;
	}

	// Проверяем, что это валидный URL (http, https, blob, data)
	try {
		const urlObj = new URL(url, window.location.href);
		const protocol = urlObj.protocol;
		return (
			protocol === "http:" ||
			protocol === "https:" ||
			protocol === "blob:" ||
			protocol === "data:"
		);
	} catch {
		// Если не удалось создать URL, это может быть относительный путь
		// Проверяем, что это не пустая строка
		return url.trim().length > 0;
	}
}

/**
 * Компонент для загрузки и настройки текстуры стены
 */
function useWallTexture(textureUrl: string | null | undefined): Texture | null {
	const [texture, setTexture] = useState<Texture | null>(null);

	useEffect(() => {
		// Проверяем валидность URL перед загрузкой
		if (!isValidTextureUrl(textureUrl)) {
			setTexture(null);
			return;
		}

		let isCancelled = false;
		const loader = new TextureLoader();

		loader.load(
			textureUrl!,
			(loadedTexture) => {
				if (isCancelled) {
					loadedTexture.dispose();
					return;
				}

				loadedTexture.wrapS = RepeatWrapping;
				loadedTexture.wrapT = RepeatWrapping;
				loadedTexture.needsUpdate = true;
				setTexture(loadedTexture);
			},
			undefined,
			(error) => {
				// Тихо обрабатываем ошибку без вывода в консоль
				// Текстура просто не будет загружена, и будет использован цвет по умолчанию
				if (!isCancelled) {
					setTexture(null);
				}
			}
		);

		return () => {
			isCancelled = true;
			setTexture((prevTexture) => {
				if (prevTexture) {
					prevTexture.dispose();
				}
				return null;
			});
		};
	}, [textureUrl]);

	return texture;
}

/**
 * UserData для объектов 3D сцены (для raycaster и обработки кликов)
 */
export interface Editor3DUserData {
	objectId: string;
	objectType: Editor3DObjectType;
	// Место для будущих полей: wallLocal, attachmentsAllowed, и т.п.
}

/**
 * Локальная система координат стены
 * Описывает базис стены для привязки проёмов, материалов и декораций
 */
export interface WallBasis {
	/** ID стены */
	id: string;
	/** Тип стены (для материала) */
	wallType: Wall["type"];
	/** Центр стены в мировых координатах */
	center: Vector3;
	/** Длина стены (по локальной оси X) */
	length: number;
	/** Высота стены (по локальной оси Y) */
	height: number;
	/** Толщина стены (по локальной оси Z) */
	thickness: number;
	/** Угол поворота стены вокруг Y (в радианах) */
	angleRad: number;
	/** Направление стены в плоскости XZ (dx) */
	dx: number;
	/** Направление стены в плоскости XZ (dz) */
	dz: number;
	/** Направление вдоль длины стены (для определения лево/право для проёмов) */
	flipAlongLength: boolean;
	/** Базис локальной системы координат */
	basis: {
		/** Точка начала локальной системы (центр стены) */
		origin: Vector3;
		/** Локальная ось X: вдоль стены (нормализованный вектор) */
		xAxis: Vector3;
		/** Локальная ось Y: вверх (0, 1, 0) */
		yAxis: Vector3;
		/** Локальная ось Z: поперёк стены (нормаль, направлена "в помещение") */
		zAxis: Vector3;
	};
}

/**
 * Сегмент стены для рендеринга
 * В будущем стена может быть разбита на несколько сегментов (из-за проёмов)
 */
export interface WallSegment {
	/** Уникальный ID сегмента (пока равен wallId, в будущем может быть wallId-segmentIndex) */
	id: string;
	/** ID стены, к которой относится сегмент */
	wallId: string;
	/** Базис стены */
	basis: WallBasis;
	/** Начало сегмента по длине стены (локальная координата X) */
	xStart: number;
	/** Конец сегмента по длине стены (локальная координата X) */
	xEnd: number;
	/** Нижняя граница сегмента по высоте (локальная координата Y) */
	yBottom: number;
	/** Верхняя граница сегмента по высоте (локальная координата Y) */
	yTop: number;
	/** Полный объект стены для доступа к свойствам материала (добавляется при создании сегментов) */
	wall?: Wall;
}

/**
 * Пропсы компонента Walls3D
 */
export interface Walls3DProps {
	walls: Map<string, Wall>;
	nodes: Map<string, Node>;
	layers: Map<string, Layer>;
	doors?: Map<string, Door>;
	windows?: Map<string, Window>;
}

/**
 * Вычисляет базис стены с локальной системой координат
 * @param wall - стена из редактора
 * @param nodes - карта узлов
 * @returns базис стены или null, если узлы не найдены
 */
export function computeWallBasis(
	wall: Wall,
	nodes: Map<string, Node>
): WallBasis | null {
	const startNode = nodes.get(wall.startNodeId);
	const endNode = nodes.get(wall.endNodeId);

	if (!startNode || !endNode) {
		return null;
	}

	// Используем существующую функцию для базовой геометрии
	const geometry = computeWallGeometry(wall, nodes);

	// Вычисляем нормализованный вектор вдоль стены (в плоскости XZ)
	const xAxis = new THREE_Vector3(geometry.dx, 0, geometry.dz).normalize();

	// Ось Y всегда вверх
	const yAxis = new THREE_Vector3(0, 1, 0);

	// Ось Z - нормаль к стене (перпендикуляр к xAxis в плоскости XZ)
	// Направлена "в помещение" (пока просто перпендикуляр, в будущем можно учесть направление)
	const zAxis = new THREE_Vector3(-xAxis.z, 0, xAxis.x).normalize();

	// Определяем направление (flipAlongLength) для будущих проёмов
	// Пока просто используем направление от startNode к endNode
	const flipAlongLength = false; // В будущем можно вычислить на основе данных стены

	// Толщина в метрах
	const thickness = mmToMeters(wall.thickness);

	return {
		id: wall.id,
		wallType: wall.type,
		center: geometry.center,
		length: geometry.length,
		height: geometry.height,
		thickness,
		angleRad: geometry.angle,
		dx: geometry.dx,
		dz: geometry.dz,
		flipAlongLength,
		basis: {
			origin: geometry.center.clone(),
			xAxis,
			yAxis,
			zAxis,
		},
	};
}

/**
 * Тип визуального представления стены
 */
type WallVisualType = "loadBearing" | "partition";

/**
 * Получает параметры материала для стены
 * @param wall - стена
 * @returns параметры материала (color, roughness, metalness)
 */
function getWallMaterialProps(wall: Wall): {
	color: string;
	roughness: number;
	metalness: number;
} {
	const visualType: WallVisualType =
		wall.type === "load-bearing" ? "loadBearing" : "partition";

	switch (visualType) {
		case "loadBearing":
			return {
				color: "#374151", // тёмно-серый
				roughness: 0.9,
				metalness: 0.0,
			};
		case "partition":
			return {
				color: "#9ca3af", // светло-серый
				roughness: 0.85,
				metalness: 0.0,
			};
	}
}

/**
 * Проверяет, пересекаются ли два интервала
 */
function intervalsOverlap(
	start1: number,
	end1: number,
	start2: number,
	end2: number
): boolean {
	return start1 < end2 && end1 > start2;
}

/**
 * Проверяет, полностью ли сегмент попадает в вырез
 */
function segmentFullyInCut(
	xStart: number,
	xEnd: number,
	yBottom: number,
	yTop: number,
	cut: WallCut
): boolean {
	return (
		xStart >= cut.xStart &&
		xEnd <= cut.xEnd &&
		yBottom >= cut.yBottom &&
		yTop <= cut.yTop
	);
}

/**
 * Создаёт список сегментов стены с учётом проёмов (дверей и окон)
 * @param wallBasis - базис стены
 * @param cuts - массив вырезов для этой стены
 * @returns список сегментов стены
 */
function createWallSegments(
	wallBasis: WallBasis,
	cuts: WallCut[]
): WallSegment[] {
	const wallXStart = -wallBasis.length / 2;
	const wallXEnd = wallBasis.length / 2;
	const wallYBottom = 0;
	const wallYTop = wallBasis.height;

	// Если нет вырезов, возвращаем один целый сегмент
	if (cuts.length === 0) {
		return [
			{
				id: wallBasis.id,
				wallId: wallBasis.id,
				basis: wallBasis,
				xStart: wallXStart,
				xEnd: wallXEnd,
				yBottom: wallYBottom,
				yTop: wallYTop,
				wall: undefined,
			},
		];
	}

	// Собираем все уникальные X-границы из вырезов
	const xBoundaries = new Set<number>([wallXStart, wallXEnd]);
	for (const cut of cuts) {
		xBoundaries.add(cut.xStart);
		xBoundaries.add(cut.xEnd);
	}

	// Сортируем X-границы
	const sortedXBoundaries = Array.from(xBoundaries).sort((a, b) => a - b);

	// Создаём сегменты по X
	const segments: WallSegment[] = [];
	let segmentIndex = 0;

	for (let i = 0; i < sortedXBoundaries.length - 1; i++) {
		const xStart = sortedXBoundaries[i];
		const xEnd = sortedXBoundaries[i + 1];

		// Пропускаем сегменты с нулевой шириной
		if (xEnd <= xStart) {
			continue;
		}

		// Находим все вырезы, которые пересекаются с этим X-сегментом
		const overlappingCuts = cuts.filter((cut) =>
			intervalsOverlap(xStart, xEnd, cut.xStart, cut.xEnd)
		);

		// Если нет пересекающихся вырезов, создаём целый сегмент по Y
		if (overlappingCuts.length === 0) {
			segments.push({
				id: `${wallBasis.id}-seg-${segmentIndex++}`,
				wallId: wallBasis.id,
				basis: wallBasis,
				xStart,
				xEnd,
				yBottom: wallYBottom,
				yTop: wallYTop,
				wall: undefined,
			});
			continue;
		}

		// Собираем все Y-границы из пересекающихся вырезов
		const yBoundaries = new Set<number>([wallYBottom, wallYTop]);
		for (const cut of overlappingCuts) {
			yBoundaries.add(cut.yBottom);
			yBoundaries.add(cut.yTop);
		}

		// Сортируем Y-границы
		const sortedYBoundaries = Array.from(yBoundaries).sort((a, b) => a - b);

		// Создаём сегменты по Y для этого X-сегмента
		for (let j = 0; j < sortedYBoundaries.length - 1; j++) {
			const yBottom = sortedYBoundaries[j];
			const yTop = sortedYBoundaries[j + 1];

			// Пропускаем сегменты с нулевой высотой
			if (yTop <= yBottom) {
				continue;
			}

			// Проверяем, не попадает ли этот сегмент полностью в какой-либо вырез
			const isInCut = overlappingCuts.some((cut) =>
				segmentFullyInCut(xStart, xEnd, yBottom, yTop, cut)
			);

			// Если сегмент не полностью в вырезе, добавляем его
			if (!isInCut) {
				segments.push({
					id: `${wallBasis.id}-seg-${segmentIndex++}`,
					wallId: wallBasis.id,
					basis: wallBasis,
					xStart,
					xEnd,
					yBottom,
					yTop,
					wall: undefined,
				});
			}
		}
	}

	// Фильтруем сегменты с нулевой шириной или высотой
	return segments.filter(
		(seg) =>
			seg.xEnd > seg.xStart &&
			seg.yTop > seg.yBottom &&
			seg.xEnd - seg.xStart > 0.001 && // минимальная ширина 1мм
			seg.yTop - seg.yBottom > 0.001 // минимальная высота 1мм
	);
}

/**
 * Компонент для рендеринга сегмента стены
 */
function WallSegmentMesh({ segment }: { segment: WallSegment }) {
	const wall = segment.wall;

	if (!wall) {
		console.error("WallSegmentMesh: wall is missing in segment", segment);
		return null;
	}

	// Загружаем текстуру, если нужно
	const baseTexture = useWallTexture(
		wall.fillMode === "texture" ? wall.texture : null
	);

	// Настраиваем текстуру с масштабом
	const configuredTexture = useMemo(() => {
		if (wall.fillMode === "texture" && wall.texture && baseTexture) {
			const scaleX = wall.textureScale?.x ?? 1;
			const scaleY = wall.textureScale?.y ?? 1;
			baseTexture.repeat.set(scaleX, scaleY);
			baseTexture.needsUpdate = true;
			return baseTexture;
		}
		return null;
	}, [baseTexture, wall.fillMode, wall.texture, wall.textureScale]);

	// Получаем параметры материала (fallback на дефолтные, если не заданы)
	const materialProps = useMemo(() => {
		if (wall.fillMode === "texture" && configuredTexture) {
			return null; // Используем текстуру
		}

		// Если задан цвет, используем его, иначе fallback на дефолтный
		if (wall.fillMode === "color" && wall.color) {
			return {
				color: wall.color,
				roughness: 0.9,
				metalness: 0.0,
			};
		}

		// Fallback на дефолтные значения по типу стены
		return getWallMaterialProps(wall);
	}, [wall, configuredTexture]);

	// Определяем цвет для fallback
	const fallbackColor =
		materialProps?.color ??
		(wall.type === "load-bearing" ? "#374151" : "#9ca3af");

	// Размеры сегмента
	const segmentWidth = segment.xEnd - segment.xStart;
	const segmentHeight = segment.yTop - segment.yBottom;
	const segmentDepth = segment.basis.thickness;

	// Позиция сегмента в локальных координатах стены
	// Центр по длине (относительно центра стены)
	const localX = (segment.xStart + segment.xEnd) / 2;
	// Центр по высоте (относительно нижнего края стены, который находится на y = 0)
	const localY = segment.yBottom + segmentHeight / 2;
	// Центр по толщине
	const localZ = 0;

	// Преобразуем локальную позицию в мировые координаты
	// Используем базис стены для преобразования
	const worldPosition = useMemo(() => {
		const localPos = new THREE_Vector3(localX, localY, localZ);
		// Применяем поворот и смещение базиса
		const rotated = new THREE_Vector3()
			.addScaledVector(segment.basis.basis.xAxis, localPos.x)
			.addScaledVector(segment.basis.basis.yAxis, localPos.y)
			.addScaledVector(segment.basis.basis.zAxis, localPos.z);
		return segment.basis.basis.origin.clone().add(rotated);
	}, [segment, localX, localY, localZ]);

	return (
		<mesh
			position={worldPosition}
			rotation-y={segment.basis.angleRad}
			castShadow
			receiveShadow
			userData={
				{
					objectId: segment.wallId,
					objectType: "wall",
				} as Editor3DUserData
			}
		>
			<boxGeometry args={[segmentWidth, segmentHeight, segmentDepth]} />
			{configuredTexture ? (
				<meshStandardMaterial
					key={`texture-${segment.id}-${wall.texture}`}
					map={configuredTexture}
					transparent={false}
					opacity={1}
					roughness={0.9}
					metalness={0.0}
				/>
			) : (
				<meshStandardMaterial
					key={`color-${segment.id}-${fallbackColor}`}
					color={fallbackColor}
					roughness={materialProps?.roughness ?? 0.9}
					metalness={materialProps?.metalness ?? 0.0}
				/>
			)}
		</mesh>
	);
}

/**
 * Компонент для рендеринга всех стен в 3D сцене
 * Реализует архитектуру с локальной системой координат для каждой стены,
 * готовую к расширению проёмами, материалами и декорациями
 */
export const Walls3D = memo(function Walls3D({
	walls,
	nodes,
	layers,
	doors = new Map(),
	windows = new Map(),
}: Walls3DProps) {
	// Вычисляем базисы всех видимых стен
	const wallBases = useMemo(() => {
		const bases: WallBasis[] = [];

		for (const wall of walls.values()) {
			// Проверяем видимость слоя
			if (!isLayerVisible(wall.layerId, layers)) {
				continue;
			}

			const basis = computeWallBasis(wall, nodes);
			if (basis) {
				bases.push(basis);
			}
		}

		return bases;
	}, [walls, nodes, layers]);

	// Создаём сегменты для всех стен с учётом проёмов
	const wallSegments = useMemo(() => {
		const segments: WallSegment[] = [];

		// Преобразуем Map в массивы для утилит
		const doorsArray = Array.from(doors.values());
		const windowsArray = Array.from(windows.values());

		for (const basis of wallBases) {
			// Получаем полный объект стены
			const wall = walls.get(basis.id);
			if (!wall) continue;

			// Собираем все вырезы для этой стены
			const doorCuts = buildDoorCutsForWall(
				basis.id,
				doorsArray,
				layers,
				basis.length,
				basis.height,
				basis.flipAlongLength
			);

			const windowCuts = buildWindowCutsForWall(
				basis.id,
				windowsArray,
				layers,
				basis.length,
				basis.height,
				basis.flipAlongLength
			);

			// Объединяем все вырезы
			const allCuts: WallCut[] = [...doorCuts, ...windowCuts];

			// Создаём сегменты с учётом вырезов
			const basisSegments = createWallSegments(basis, allCuts);
			// Добавляем wall к каждому сегменту
			for (const seg of basisSegments) {
				segments.push({
					...seg,
					wall,
				} as WallSegment);
			}
		}

		return segments;
	}, [wallBases, doors, windows, layers]);

	// Рендерим все сегменты
	return (
		<>
			{wallSegments.map((segment) => (
				<WallSegmentMesh key={segment.id} segment={segment} />
			))}
		</>
	);
});
