"use server";

import { auth } from "@/lib/auth";
import { createMessage } from "@/lib/services/messages";
import { getAIResponse } from "@/lib/services/ai";

export async function sendMessage(projectId: string, content: string) {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return {
				success: false,
				error: "Необходима авторизация",
			};
		}

		// Сохраняем сообщение пользователя
		const userMessage = await createMessage(projectId, session.user.id, {
			role: "user",
			content: content.trim(),
		});

		// Получаем ответ от AI (интеграция с нейросетью)
		const aiResponse = await getAIResponse(projectId, content);

		// Сохраняем ответ ассистента
		const assistantMessage = await createMessage(projectId, session.user.id, {
			role: "assistant",
			content: aiResponse,
		});

		return {
			success: true,
			userMessage,
			assistantMessage,
		};
	} catch (error) {
		console.error("Error in sendMessage:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Произошла ошибка",
		};
	}
}

