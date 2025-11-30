"use client";

import {
	createContext,
	useContext,
	useRef,
	useCallback,
	type ReactNode,
} from "react";

export type InteractiveObjectType = "door" | "window";

export interface InteractiveObjectHandle {
	id: string;
	type: InteractiveObjectType;
	toggle: () => void;
}

export interface Editor3DInteractionContextValue {
	registerInteractiveObject: (handle: InteractiveObjectHandle) => void;
	unregisterInteractiveObject: (
		id: string,
		type: InteractiveObjectType
	) => void;
	toggleObjectById: (id: string, type: InteractiveObjectType) => void;
}

const Editor3DInteractionContext =
	createContext<Editor3DInteractionContextValue | null>(null);

/**
 * Провайдер контекста для управления интерактивными объектами в 3D редакторе
 * Позволяет регистрировать двери и окна для взаимодействия через клик или клавишу E
 */
export function Editor3DInteractionProvider({
	children,
}: {
	children: ReactNode;
}) {
	// Хранилище интерактивных объектов: ключ = `${type}:${id}`
	const objectsRef = useRef<Map<string, InteractiveObjectHandle>>(new Map());

	const registerInteractiveObject = useCallback(
		(handle: InteractiveObjectHandle) => {
			const key = `${handle.type}:${handle.id}`;
			objectsRef.current.set(key, handle);
		},
		[]
	);

	const unregisterInteractiveObject = useCallback(
		(id: string, type: InteractiveObjectType) => {
			const key = `${type}:${id}`;
			objectsRef.current.delete(key);
		},
		[]
	);

	const toggleObjectById = useCallback(
		(id: string, type: InteractiveObjectType) => {
			const key = `${type}:${id}`;
			const handle = objectsRef.current.get(key);
			if (handle) {
				handle.toggle();
			}
		},
		[]
	);

	const value: Editor3DInteractionContextValue = {
		registerInteractiveObject,
		unregisterInteractiveObject,
		toggleObjectById,
	};

	return (
		<Editor3DInteractionContext.Provider value={value}>
			{children}
		</Editor3DInteractionContext.Provider>
	);
}

/**
 * Хук для доступа к контексту взаимодействий Editor3D
 * @throws Error если используется вне Editor3DInteractionProvider
 */
export function useEditor3DInteraction(): Editor3DInteractionContextValue {
	const context = useContext(Editor3DInteractionContext);
	if (!context) {
		throw new Error(
			"useEditor3DInteraction must be used within Editor3DInteractionProvider"
		);
	}
	return context;
}
