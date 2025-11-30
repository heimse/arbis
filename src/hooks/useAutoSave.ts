"use client";

import { useEffect, useRef, useCallback } from "react";
import type { EditorState } from "@/types/editor";

interface UseAutoSaveOptions {
	projectId: string;
	state: EditorState;
	enabled?: boolean;
	debounceMs?: number;
	intervalMs?: number;
	onSaveStart?: () => void;
	onSaveSuccess?: () => void;
	onSaveError?: (error: Error) => void;
}

/**
 * Хук для автоматического сохранения планировки
 *
 * Сохраняет:
 * 1. После крупных действий (с debounce)
 * 2. Периодически каждые N минут
 */
export function useAutoSave({
	projectId,
	state,
	enabled = true,
	debounceMs = 2000, // 2 секунды задержка после действия
	intervalMs = 3 * 60 * 1000, // 3 минуты
	onSaveStart,
	onSaveSuccess,
	onSaveError,
}: UseAutoSaveOptions) {
	const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	const lastSavedRef = useRef<number>(0);
	const isSavingRef = useRef<boolean>(false);
	const lastStateHashRef = useRef<string>("");

	// Функция для получения хеша состояния (для определения изменений)
	const getStateHash = useCallback((state: EditorState): string => {
		// Создаем упрощенный хеш состояния, исключая временные поля
		// Сортируем для стабильности хеша
		const stateData = {
			nodes: Array.from(state.nodes.values())
				.sort((a, b) => a.id.localeCompare(b.id))
				.map((n) => ({
					id: n.id,
					position: { x: n.x, y: n.y },
				})),
			walls: Array.from(state.walls.values())
				.sort((a, b) => a.id.localeCompare(b.id))
				.map((w) => ({
					id: w.id,
					startNodeId: w.startNodeId,
					endNodeId: w.endNodeId,
					thickness: w.thickness,
				})),
			doors: Array.from(state.doors.values())
				.sort((a, b) => a.id.localeCompare(b.id))
				.map((d) => ({
					id: d.id,
					wallId: d.wallId,
					position: d.position,
					width: d.width,
				})),
			windows: Array.from(state.windows.values())
				.sort((a, b) => a.id.localeCompare(b.id))
				.map((w) => ({
					id: w.id,
					wallId: w.wallId,
					position: w.position,
					width: w.width,
				})),
			rooms: Array.from(state.rooms.values())
				.sort((a, b) => a.id.localeCompare(b.id))
				.map((r) => ({
					id: r.id,
					name: r.name,
					position: r.position,
					size: r.size,
					rotation: r.rotation,
					layerId: r.layerId,
				})),
			furniture: Array.from(state.furniture.values())
				.sort((a, b) => a.id.localeCompare(b.id))
				.map((f) => ({
					id: f.id,
					type: f.type,
					position: f.position,
				})),
		};
		return JSON.stringify(stateData);
	}, []);

	// Функция сохранения
	const savePlan = useCallback(async () => {
		if (isSavingRef.current) {
			return; // Уже идет сохранение
		}

		// Проверяем, изменилось ли состояние
		const currentHash = getStateHash(state);
		if (currentHash === lastStateHashRef.current) {
			return; // Состояние не изменилось
		}

		isSavingRef.current = true;
		onSaveStart?.();

		try {
			// Преобразуем Map в массивы для JSON
			const planData = {
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
			};

			// Конвертируем blob URLs в base64 для сохранения
			const { convertBlobUrlsToBase64 } = await import(
				"@/lib/editor/textureUtils"
			);
			const planDataWithBase64 = await convertBlobUrlsToBase64(planData);

			const response = await fetch(`/api/projects/${projectId}/plan`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					planData: planDataWithBase64,
					versionName: `Автосохранение ${new Date().toLocaleTimeString(
						"ru-RU"
					)}`,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.error || "Ошибка при сохранении");
			}

			const data = await response.json();
			lastSavedRef.current = Date.now();
			lastStateHashRef.current = currentHash;
			onSaveSuccess?.();
		} catch (error) {
			console.error("Ошибка автосохранения:", error);
			onSaveError?.(error as Error);
		} finally {
			isSavingRef.current = false;
		}
	}, [projectId, state, getStateHash, onSaveStart, onSaveSuccess, onSaveError]);

	// Определяем крупные действия, которые требуют сохранения
	const isMajorAction = useCallback((state: EditorState): boolean => {
		// Проверяем наличие значимых объектов
		const hasNodes = state.nodes.size > 0;
		const hasWalls = state.walls.size > 0;
		const hasRooms = state.rooms.size > 0;
		const hasFurniture = state.furniture.size > 0;

		return hasNodes || hasWalls || hasRooms || hasFurniture;
	}, []);

	// Инициализация хеша при первой загрузке
	useEffect(() => {
		if (lastStateHashRef.current === "") {
			lastStateHashRef.current = getStateHash(state);
		}
	}, [state, getStateHash]);

	// Отслеживание изменений состояния для автосохранения после действий
	useEffect(() => {
		if (!enabled) {
			return;
		}

		// Проверяем, есть ли крупные изменения
		if (!isMajorAction(state)) {
			return;
		}

		// Проверяем, изменилось ли состояние
		const currentHash = getStateHash(state);
		if (currentHash === lastStateHashRef.current) {
			return; // Состояние не изменилось
		}

		// Очищаем предыдущий таймер
		if (saveTimeoutRef.current) {
			clearTimeout(saveTimeoutRef.current);
		}

		// Устанавливаем новый таймер для сохранения
		saveTimeoutRef.current = setTimeout(() => {
			savePlan();
		}, debounceMs);

		return () => {
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
			}
		};
	}, [state, enabled, debounceMs, savePlan, isMajorAction, getStateHash]);

	// Периодическое сохранение
	useEffect(() => {
		if (!enabled) {
			return;
		}

		intervalRef.current = setInterval(() => {
			// Сохраняем только если есть изменения и прошло достаточно времени
			const timeSinceLastSave = Date.now() - lastSavedRef.current;
			if (timeSinceLastSave >= intervalMs && isMajorAction(state)) {
				savePlan();
			}
		}, intervalMs);

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, [enabled, intervalMs, savePlan, isMajorAction, state]);

	// Очистка при размонтировании
	useEffect(() => {
		return () => {
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
			}
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, []);

	return {
		savePlan,
		isSaving: isSavingRef.current,
	};
}
