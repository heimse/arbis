"use client";

import * as React from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils/cn";
import { sendMessage } from "@/app/actions/chat";

interface Message {
	id: string;
	role: "user" | "assistant" | "system";
	content: string;
	createdAt: Date;
}

interface ChatInterfaceProps {
	projectId: string;
	initialMessages: Message[];
}

export function ChatInterface({ projectId, initialMessages }: ChatInterfaceProps) {
	const [messages, setMessages] = React.useState<Message[]>(initialMessages);
	const [input, setInput] = React.useState("");
	const [isLoading, setIsLoading] = React.useState(false);
	const scrollAreaRef = React.useRef<HTMLDivElement>(null);
	const messagesEndRef = React.useRef<HTMLDivElement>(null);

	// Автопрокрутка к последнему сообщению
	React.useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

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
			// Отправляем сообщение на сервер
			const result = await sendMessage(projectId, userMessage);

			if (result.success && result.userMessage && result.assistantMessage) {
				// Удаляем временное сообщение и добавляем реальные
				setMessages((prev) => {
					const filtered = prev.filter((m) => m.id !== tempUserMessage.id);
					return [
						...filtered,
						{
							id: result.userMessage!.id,
							role: result.userMessage!.role as "user" | "assistant" | "system",
							content: result.userMessage!.content,
							createdAt: result.userMessage!.createdAt,
						},
						{
							id: result.assistantMessage!.id,
							role: result.assistantMessage!.role as "user" | "assistant" | "system",
							content: result.assistantMessage!.content,
							createdAt: result.assistantMessage!.createdAt,
						},
					];
				});
			} else {
				// Если ошибка, удаляем временное сообщение
				setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
				alert(result.error || "Ошибка при отправке сообщения");
			}
		} catch (error) {
			console.error("Error sending message:", error);
			// Удаляем временное сообщение при ошибке
			setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
			alert("Произошла ошибка. Попробуйте еще раз.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex flex-col h-full">
			{/* Область сообщений */}
			<ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
				<div className="space-y-4 pb-4">
					{messages.length === 0 ? (
						<div className="flex flex-col items-center justify-center h-full py-12 text-center">
							<Bot className="h-12 w-12 text-muted-foreground mb-4" />
							<p className="text-lg font-medium mb-2">Начните общение</p>
							<p className="text-sm text-muted-foreground max-w-md">
								Задайте вопрос о планировке, и AI-ассистент поможет вам
							</p>
						</div>
					) : (
						messages.map((message) => (
							<div
								key={message.id}
								className={cn(
									"flex items-start space-x-3",
									message.role === "user" && "flex-row-reverse space-x-reverse"
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
										"flex-1 rounded-lg px-4 py-2 max-w-[80%]",
										message.role === "user"
											? "bg-primary text-primary-foreground"
											: "bg-muted"
									)}
								>
									<p className={cn(
										"text-sm whitespace-pre-wrap break-words",
										message.role === "user" ? "text-primary-foreground" : "text-foreground"
									)}>
										{message.content}
									</p>
									<p className={cn(
										"text-xs mt-1",
										message.role === "user" ? "opacity-70" : "text-muted-foreground"
									)}>
										{new Date(message.createdAt).toLocaleTimeString("ru-RU", {
											hour: "2-digit",
											minute: "2-digit",
										})}
									</p>
								</div>
							</div>
						))
					)}
					{isLoading && (
						<div className="flex items-start space-x-3">
							<div className="flex-shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
								<Bot className="h-4 w-4 text-muted-foreground" />
							</div>
							<div className="flex-1 rounded-lg px-4 py-2 bg-muted">
								<div className="flex items-center space-x-2">
									<Loader2 className="h-4 w-4 animate-spin" />
									<span className="text-sm text-muted-foreground">
										AI-ассистент печатает...
									</span>
								</div>
							</div>
						</div>
					)}
					<div ref={messagesEndRef} />
				</div>
			</ScrollArea>

			{/* Поле ввода */}
			<div className="border-t pt-4">
				<form onSubmit={handleSubmit} className="flex space-x-2">
					<Textarea
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder="Введите ваше сообщение..."
						className="min-h-[60px] resize-none"
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
						size="icon"
						className="h-[60px] w-[60px]"
						disabled={!input.trim() || isLoading}
					>
						{isLoading ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Send className="h-4 w-4" />
						)}
					</Button>
				</form>
			</div>
		</div>
	);
}

