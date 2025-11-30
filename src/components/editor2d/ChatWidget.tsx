"use client";

import React, { useState, useRef, useEffect } from "react";
import {
	MessageSquare,
	X,
	Minimize2,
	Maximize2,
	Send,
	Bot,
	User,
	Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils/cn";
import { useEditor } from "@/store/editorStore";
import { sendMessage } from "@/app/actions/chat";

interface Message {
	id: string;
	role: "user" | "assistant" | "system";
	content: string;
	createdAt: Date;
	links?: string[];
}

interface ChatWidgetProps {
	projectId: string;
}

export function ChatWidget({ projectId }: ChatWidgetProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isMinimized, setIsMinimized] = useState(false);
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const { state } = useEditor();

	// Автопрокрутка к последнему сообщению
	useEffect(() => {
		if (isOpen && !isMinimized) {
			messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages, isOpen, isMinimized]);

	// Получаем JSON проекта для контекста
	const getProjectJSON = () => {
		return {
			nodes: Array.from(state.nodes.values()),
			walls: Array.from(state.walls.values()),
			doors: Array.from(state.doors.values()),
			windows: Array.from(state.windows.values()),
			rooms: Array.from(state.rooms.values()),
			furniture: Array.from(state.furniture.values()),
			dimensions: Array.from(state.dimensions.values()),
			layers: Array.from(state.layers.values()),
			camera: state.camera,
			gridSettings: state.gridSettings,
			planSettings: state.planSettings,
		};
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!input.trim() || isLoading) return;

		const userMessage = input.trim();
		setInput("");
		setIsLoading(true);

		// Добавляем сообщение пользователя сразу
		const tempUserMessage: Message = {
			id: `temp-${Date.now()}`,
			role: "user",
			content: userMessage,
			createdAt: new Date(),
		};
		setMessages((prev) => [...prev, tempUserMessage]);

		try {
			// Получаем JSON проекта для контекста
			const projectJSON = getProjectJSON();

			// Формируем сообщение с контекстом проекта
			const contextualMessage = `${userMessage}\n\nКонтекст проекта (JSON):\n${JSON.stringify(
				projectJSON,
				null,
				2
			)}`;

			// Отправляем сообщение на сервер
			const result = await sendMessage(projectId, contextualMessage);

			if (result.success && result.assistantMessage) {
				// Удаляем временное сообщение пользователя
				setMessages((prev) =>
					prev.filter((msg) => msg.id !== tempUserMessage.id)
				);

				// Добавляем постоянное сообщение пользователя
				const userMsg: Message = {
					id: result.userMessage.id,
					role: "user",
					content: userMessage,
					createdAt: new Date(result.userMessage.createdAt),
				};

				// Парсим ответ ассистента на наличие ссылок
				const assistantContent = result.assistantMessage.content;
				const links = extractLinks(assistantContent);
				const cleanContent = removeLinksFromContent(assistantContent);

				const assistantMsg: Message = {
					id: result.assistantMessage.id,
					role: "assistant",
					content: cleanContent,
					createdAt: new Date(result.assistantMessage.createdAt),
					links: links.length > 0 ? links : undefined,
				};

				setMessages((prev) => [...prev, userMsg, assistantMsg]);
			} else {
				// Ошибка - удаляем временное сообщение и показываем ошибку
				setMessages((prev) => {
					const filtered = prev.filter((msg) => msg.id !== tempUserMessage.id);
					return [
						...filtered,
						{
							id: `error-${Date.now()}`,
							role: "assistant",
							content:
								result.error || "Произошла ошибка при отправке сообщения",
							createdAt: new Date(),
						},
					];
				});
			}
		} catch (error) {
			console.error("Error sending message:", error);
			setMessages((prev) => {
				const filtered = prev.filter((msg) => msg.id !== tempUserMessage.id);
				return [
					...filtered,
					{
						id: `error-${Date.now()}`,
						role: "assistant",
						content:
							"Произошла ошибка при отправке сообщения. Попробуйте еще раз.",
						createdAt: new Date(),
					},
				];
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Извлекаем ссылки из текста
	const extractLinks = (text: string): string[] => {
		const urlRegex = /(https?:\/\/[^\s]+)/g;
		const matches = text.match(urlRegex);
		return matches || [];
	};

	// Удаляем ссылки из текста для отображения
	const removeLinksFromContent = (text: string): string => {
		const urlRegex = /(https?:\/\/[^\s]+)/g;
		return text.replace(urlRegex, "").trim();
	};

	if (!isOpen) {
		return (
			<button
				onClick={() => setIsOpen(true)}
				className="fixed bottom-4 right-4 z-50 bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:bg-primary/90 transition-colors"
				title="Открыть чат с AI"
			>
				<MessageSquare className="h-6 w-6" />
			</button>
		);
	}

	return (
		<div
			className={cn(
				"fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-2xl flex flex-col transition-all duration-300",
				isMinimized ? "w-80 h-12" : "w-96 h-[600px]"
			)}
		>
			{/* Заголовок */}
			<div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 rounded-t-lg">
				<div className="flex items-center gap-2">
					<Bot className="h-5 w-5 text-primary" />
					<h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
						AI Ассистент
					</h3>
				</div>
				<div className="flex items-center gap-2">
					<button
						onClick={() => setIsMinimized(!isMinimized)}
						className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
						title={isMinimized ? "Развернуть" : "Свернуть"}
					>
						{isMinimized ? (
							<Maximize2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
						) : (
							<Minimize2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
						)}
					</button>
					<button
						onClick={() => {
							setIsOpen(false);
							setIsMinimized(false);
						}}
						className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
						title="Закрыть"
					>
						<X className="h-4 w-4 text-gray-600 dark:text-gray-400" />
					</button>
				</div>
			</div>

			{/* Контент чата */}
			{!isMinimized && (
				<>
					{/* Область сообщений */}
					<ScrollArea className="flex-1 px-4 py-4">
						<div className="space-y-4">
							{messages.length === 0 ? (
								<div className="flex flex-col items-center justify-center h-full py-12 text-center">
									<Bot className="h-12 w-12 text-muted-foreground mb-4" />
									<p className="text-lg font-medium mb-2">
										AI Ассистент готов помочь
									</p>
									<p className="text-sm text-muted-foreground max-w-md">
										Задайте вопрос о проекте, попросите посчитать смету
										материалов или спросите о планировке
									</p>
								</div>
							) : (
								messages.map((message) => (
									<div
										key={message.id}
										className={cn(
											"flex items-start space-x-3",
											message.role === "user" &&
												"flex-row-reverse space-x-reverse"
										)}
									>
										<div
											className={cn(
												"flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
												message.role === "user"
													? "bg-primary text-primary-foreground"
													: "bg-muted text-muted-foreground"
											)}
										>
											{message.role === "user" ? (
												<User className="h-4 w-4" />
											) : (
												<Bot className="h-4 w-4" />
											)}
										</div>
										<div
											className={cn(
												"flex-1 rounded-lg px-4 py-2 max-w-[85%]",
												message.role === "user"
													? "bg-primary text-primary-foreground"
													: "bg-muted text-muted-foreground"
											)}
										>
											<div className="text-sm whitespace-pre-wrap break-words">
												{message.content}
											</div>
											{/* Ссылки */}
											{message.links && message.links.length > 0 && (
												<div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-700">
													<div className="text-xs font-medium mb-1">
														Полезные ссылки:
													</div>
													<div className="space-y-1">
														{message.links.map((link, index) => (
															<a
																key={index}
																href={link}
																target="_blank"
																rel="noopener noreferrer"
																className="text-xs text-blue-600 dark:text-blue-400 hover:underline block truncate"
															>
																{link}
															</a>
														))}
													</div>
												</div>
											)}
										</div>
									</div>
								))
							)}
							{isLoading && (
								<div className="flex items-start space-x-3">
									<div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-muted text-muted-foreground">
										<Bot className="h-4 w-4" />
									</div>
									<div className="flex-1 rounded-lg px-4 py-2 bg-muted text-muted-foreground">
										<Loader2 className="h-4 w-4 animate-spin" />
									</div>
								</div>
							)}
							<div ref={messagesEndRef} />
						</div>
					</ScrollArea>

					{/* Поле ввода */}
					<div className="border-t border-gray-200 dark:border-gray-800 p-4">
						<form onSubmit={handleSubmit} className="flex gap-2">
							<Textarea
								value={input}
								onChange={(e) => setInput(e.target.value)}
								placeholder="Задайте вопрос о проекте..."
								className="flex-1 min-h-[60px] max-h-[120px] resize-none"
								onKeyDown={(e) => {
									if (e.key === "Enter" && !e.shiftKey) {
										e.preventDefault();
										handleSubmit(e);
									}
								}}
								disabled={isLoading}
							/>
							<Button
								type="submit"
								disabled={!input.trim() || isLoading}
								size="icon"
								className="flex-shrink-0"
							>
								{isLoading ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<Send className="h-4 w-4" />
								)}
							</Button>
						</form>
					</div>
				</>
			)}
		</div>
	);
}

