"use client";

import { useEffect } from "react";
import { useEditor } from "@/store/editorStore";
import { WallTool } from "./tools/WallTool";

/**
 * Компонент для обработки горячих клавиш
 */
export function KeyboardHandler() {
	const { state, setTool, deleteSelected, dispatch, undo, redo } = useEditor();

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Игнорируем, если фокус на input/textarea
			if (
				document.activeElement?.tagName === "INPUT" ||
				document.activeElement?.tagName === "TEXTAREA"
			) {
				return;
			}

			// Горячие клавиши для инструментов
			switch (e.key.toLowerCase()) {
				case "v":
					setTool("select");
					break;

				case "w":
					if (e.shiftKey) {
						setTool("window");
					} else {
						setTool("wall");
					}
					break;

				case "d":
					setTool("door");
					break;

				case "r":
					setTool("dimension");
					break;

				case "escape":
					// Если рисуем размерную линию - отменяем
					if (state.dimensionDrawingState.isDrawing) {
						dispatch({ type: "CANCEL_DIMENSION_DRAWING" });
					} else if (state.roomSelectionState.isSelecting) {
						// Если выделяем область для комнаты - отменяем
						dispatch({ type: "CANCEL_ROOM_SELECTION" });
					} else if (state.wallDrawingState.isDrawing) {
						// Если рисуем стену - завершаем
						WallTool.finishDrawing(dispatch);
					} else if (state.isDragging) {
						// Если перетаскиваем - отменяем drag (откатываем к начальному состоянию)
						dispatch({ type: "UNDO" }); // Откатываем к снапшоту перед drag
						dispatch({ type: "END_DRAG", cancel: true }); // Сбрасываем флаг без сохранения
					} else {
						// Снимаем выделение
						dispatch({
							type: "SET_SELECTION",
							selection: { type: null, id: null },
						});
					}
					break;

				case "delete":
				case "backspace":
					if (state.selection.id && state.selection.type) {
						deleteSelected();
					}
					break;

				case "z":
					if (e.ctrlKey || e.metaKey) {
						e.preventDefault();
						if (e.shiftKey) {
							redo();
						} else {
							undo();
						}
					}
					break;

				case "y":
					if (e.ctrlKey || e.metaKey) {
						e.preventDefault();
						redo();
					}
					break;

				default:
					break;
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [state, setTool, deleteSelected, dispatch, undo, redo]);

	// Обработка двойного клика для завершения рисования стены
	useEffect(() => {
		const handleDoubleClick = () => {
			if (state.wallDrawingState.isDrawing && state.activeTool === "wall") {
				WallTool.finishDrawing(dispatch);
			}
		};

		window.addEventListener("dblclick", handleDoubleClick);
		return () => window.removeEventListener("dblclick", handleDoubleClick);
	}, [state.wallDrawingState.isDrawing, state.activeTool, dispatch]);

	return null;
}
