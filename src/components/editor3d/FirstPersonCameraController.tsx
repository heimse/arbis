"use client";

import { useEffect, useRef, useCallback } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import type { PerspectiveCamera } from "three";
import { Vector3, Raycaster, type Object3D } from "three";
import { useEditor3DInteraction } from "./Editor3DInteractionContext";
import type { InteractiveObjectType } from "./Editor3DInteractionContext";

export interface FirstPersonCameraControllerProps {
	centerX: number;
	centerZ: number;
	floorY?: number; // по умолчанию 0
	initialHeight?: number; // по умолчанию 1.7
}

/**
 * Скорость движения в м/с
 */
const MOVE_SPEED = 4.0;

/**
 * Чувствительность мыши (множитель для поворота)
 */
const MOUSE_SENSITIVITY = 0.002;

/**
 * Максимальное расстояние для взаимодействия с объектами (в метрах)
 */
const INTERACT_DISTANCE = 3;

/**
 * Ограничение угла наклона (pitch) в радианах
 * От -85° до +85°
 */
const MIN_PITCH = -Math.PI * 0.47;
const MAX_PITCH = Math.PI * 0.47;

/**
 * Компонент управления камерой от первого лица (FPS)
 * Управление: WASD для движения, мышь для поворота взгляда
 */
export function FirstPersonCameraController({
	centerX,
	centerZ,
	floorY = 0,
	initialHeight = 1.7,
}: FirstPersonCameraControllerProps) {
	const { camera, scene } = useThree();
	const gl = useThree((state) => state.gl);
	const { toggleObjectById } = useEditor3DInteraction();

	// Состояние нажатых клавиш
	const keysRef = useRef({
		forward: false, // W
		backward: false, // S
		left: false, // A
		right: false, // D
		interact: false, // E
	});

	// Состояние углов камеры
	const eulerRef = useRef({
		yaw: 0, // поворот по оси Y (горизонтальный)
		pitch: 0, // наклон по оси X (вертикальный)
	});

	// Флаг активности pointer lock
	const isPointerLockedRef = useRef(false);

	/**
	 * Обновляет вращение камеры на основе yaw и pitch
	 */
	const updateCameraRotation = (cam: PerspectiveCamera) => {
		// Устанавливаем вращение камеры через euler углы
		// В Three.js порядок: X (pitch), Y (yaw), Z (roll)
		cam.rotation.order = "YXZ";
		cam.rotation.y = eulerRef.current.yaw;
		cam.rotation.x = eulerRef.current.pitch;
		cam.rotation.z = 0;
	};

	// Инициализация позиции и углов камеры
	useEffect(() => {
		const cam = camera as PerspectiveCamera;

		// Устанавливаем начальную позицию
		cam.position.set(centerX, floorY + initialHeight, centerZ);

		// Начальный взгляд вдоль оси -Z (вперёд)
		eulerRef.current.yaw = 0;
		eulerRef.current.pitch = 0;

		// Обновляем вращение камеры
		updateCameraRotation(cam);
	}, [centerX, centerZ, floorY, initialHeight, camera]);

	/**
	 * Находит интерактивный объект (дверь/окно) в иерархии объектов
	 * Поднимается по родителям, пока не найдёт userData с objectId и objectType
	 */
	const findInteractiveObject = useCallback(
		(
			object: Object3D
		): {
			objectId: string;
			objectType: InteractiveObjectType;
		} | null => {
			let current: Object3D | null = object;
			while (current) {
				const userData = current.userData;
				if (
					userData &&
					typeof userData.objectId === "string" &&
					(userData.objectType === "door" || userData.objectType === "window")
				) {
					return {
						objectId: userData.objectId,
						objectType: userData.objectType as InteractiveObjectType,
					};
				}
				current = current.parent;
			}
			return null;
		},
		[]
	);

	/**
	 * Выполняет взаимодействие с объектом по направлению взгляда камеры
	 */
	const performInteraction = useCallback(() => {
		const cam = camera as PerspectiveCamera;

		// Получаем направление взгляда камеры
		const direction = new Vector3();
		cam.getWorldDirection(direction);

		// Создаём raycaster из позиции камеры
		const origin = cam.position.clone();
		const raycaster = new Raycaster(origin, direction, 0, INTERACT_DISTANCE);

		// Выполняем пересечение со всеми объектами сцены
		const intersects = raycaster.intersectObjects(scene.children, true);

		// Ищем первое пересечение с интерактивным объектом
		for (const intersection of intersects) {
			const interactive = findInteractiveObject(intersection.object);
			if (interactive) {
				toggleObjectById(interactive.objectId, interactive.objectType);
				break; // Прерываем после первого успешного попадания
			}
		}
	}, [camera, scene, findInteractiveObject, toggleObjectById]);

	// Подписка на события клавиатуры
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			const key = event.key.toLowerCase();
			const isMovementKey =
				key === "w" || key === "s" || key === "a" || key === "d";
			const isInteractKey = event.code === "KeyE";

			// Обрабатываем клавиши движения
			if (isMovementKey) {
				// Предотвращаем стандартное поведение браузера
				event.preventDefault();
				event.stopPropagation();

				switch (key) {
					case "w":
						keysRef.current.forward = true;
						break;
					case "s":
						keysRef.current.backward = true;
						break;
					case "a":
						keysRef.current.left = true;
						break;
					case "d":
						keysRef.current.right = true;
						break;
				}
			}

			// Обрабатываем клавишу взаимодействия E
			if (isInteractKey) {
				event.preventDefault();
				event.stopPropagation();

				// Выполняем взаимодействие только при первом нажатии
				if (!keysRef.current.interact) {
					keysRef.current.interact = true;
					performInteraction();
				}
			}
		};

		const handleKeyUp = (event: KeyboardEvent) => {
			const key = event.key.toLowerCase();
			const isMovementKey =
				key === "w" || key === "s" || key === "a" || key === "d";
			const isInteractKey = event.code === "KeyE";

			// Всегда сбрасываем состояние клавиш при отпускании
			if (isMovementKey) {
				event.preventDefault();
				event.stopPropagation();

				switch (key) {
					case "w":
						keysRef.current.forward = false;
						break;
					case "s":
						keysRef.current.backward = false;
						break;
					case "a":
						keysRef.current.left = false;
						break;
					case "d":
						keysRef.current.right = false;
						break;
				}
			}

			// Сбрасываем состояние клавиши взаимодействия
			if (isInteractKey) {
				event.preventDefault();
				event.stopPropagation();
				keysRef.current.interact = false;
			}
		};

		// Используем document вместо window для лучшей совместимости с pointer lock
		// Также добавляем на window для резерва
		document.addEventListener("keydown", handleKeyDown, true);
		document.addEventListener("keyup", handleKeyUp, true);
		window.addEventListener("keydown", handleKeyDown, true);
		window.addEventListener("keyup", handleKeyUp, true);

		return () => {
			document.removeEventListener("keydown", handleKeyDown, true);
			document.removeEventListener("keyup", handleKeyUp, true);
			window.removeEventListener("keydown", handleKeyDown, true);
			window.removeEventListener("keyup", handleKeyUp, true);
		};
	}, [performInteraction]);

	// Подписка на pointer lock и движение мыши
	useEffect(() => {
		const canvas = gl.domElement;

		// Делаем canvas фокусируемым для правильной работы клавиатуры
		canvas.setAttribute("tabindex", "0");
		canvas.style.outline = "none";

		const handlePointerLockChange = () => {
			const wasLocked = isPointerLockedRef.current;
			isPointerLockedRef.current = document.pointerLockElement === canvas;

			// Автоматически фокусируем canvas при активации pointer lock
			if (isPointerLockedRef.current) {
				canvas.focus();
			} else if (wasLocked) {
				// Сбрасываем состояние клавиш при потере pointer lock
				keysRef.current.forward = false;
				keysRef.current.backward = false;
				keysRef.current.left = false;
				keysRef.current.right = false;
			}
		};

		const handlePointerLockError = () => {
			console.warn("Pointer lock failed");
			// Сбрасываем состояние клавиш при ошибке
			keysRef.current.forward = false;
			keysRef.current.backward = false;
			keysRef.current.left = false;
			keysRef.current.right = false;
			isPointerLockedRef.current = false;
		};

		const handleMouseMove = (event: MouseEvent) => {
			if (!isPointerLockedRef.current) return;

			// Используем movementX/Y для плавного поворота
			const deltaX = event.movementX ?? 0;
			const deltaY = event.movementY ?? 0;

			// Обновляем углы
			eulerRef.current.yaw -= deltaX * MOUSE_SENSITIVITY;
			eulerRef.current.pitch -= deltaY * MOUSE_SENSITIVITY;

			// Ограничиваем pitch
			eulerRef.current.pitch = Math.max(
				MIN_PITCH,
				Math.min(MAX_PITCH, eulerRef.current.pitch)
			);
		};

		const handleClick = () => {
			if (!isPointerLockedRef.current) {
				canvas.focus(); // Фокусируем перед запросом pointer lock
				canvas.requestPointerLock();
			}
		};

		const handleBlur = () => {
			// Сбрасываем состояние клавиш при потере фокуса
			keysRef.current.forward = false;
			keysRef.current.backward = false;
			keysRef.current.left = false;
			keysRef.current.right = false;
		};

		// Подписываемся на события
		document.addEventListener("pointerlockchange", handlePointerLockChange);
		document.addEventListener("pointerlockerror", handlePointerLockError);
		document.addEventListener("mousemove", handleMouseMove);
		canvas.addEventListener("click", handleClick);
		canvas.addEventListener("blur", handleBlur);

		return () => {
			document.removeEventListener(
				"pointerlockchange",
				handlePointerLockChange
			);
			document.removeEventListener("pointerlockerror", handlePointerLockError);
			document.removeEventListener("mousemove", handleMouseMove);
			canvas.removeEventListener("click", handleClick);
			canvas.removeEventListener("blur", handleBlur);

			// Выходим из pointer lock при размонтировании
			if (document.pointerLockElement === canvas) {
				document.exitPointerLock();
			}
		};
	}, [gl.domElement]);

	// Обновление позиции камеры в каждом кадре
	useFrame((state, delta) => {
		const cam = camera as PerspectiveCamera;

		// Обновляем вращение камеры
		updateCameraRotation(cam);

		// Вычисляем направление движения
		const forward = new Vector3();
		cam.getWorldDirection(forward);

		// Проецируем forward на плоскость XZ (обнуляем Y)
		forward.y = 0;
		forward.normalize();

		// Вычисляем вектор вправо (cross product forward × up)
		const up = new Vector3(0, 1, 0);
		const right = new Vector3();
		right.crossVectors(forward, up).normalize();

		// Вычисляем смещение за кадр
		const moveDelta = MOVE_SPEED * delta;
		const moveVector = new Vector3(0, 0, 0);

		if (keysRef.current.forward) {
			moveVector.add(forward.clone().multiplyScalar(moveDelta));
		}
		if (keysRef.current.backward) {
			moveVector.add(forward.clone().multiplyScalar(-moveDelta));
		}
		if (keysRef.current.left) {
			moveVector.add(right.clone().multiplyScalar(-moveDelta));
		}
		if (keysRef.current.right) {
			moveVector.add(right.clone().multiplyScalar(moveDelta));
		}

		// Обновляем позицию камеры
		cam.position.add(moveVector);

		// Фиксируем высоту камеры
		cam.position.y = floorY + initialHeight;
	});

	// Компонент ничего не рендерит
	return null;
}
