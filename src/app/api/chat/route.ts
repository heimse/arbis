/**
 * Chat API Route
 * 
 * API endpoint для интеграции с нейросетью
 * POST /api/chat
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAIResponse } from "@/lib/services/ai";

export async function POST(req: NextRequest) {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		const body = await req.json();
		const { projectId, message } = body;

		if (!projectId || !message) {
			return NextResponse.json(
				{ error: "projectId and message are required" },
				{ status: 400 }
			);
		}

		// Получаем ответ от AI
		const aiResponse = await getAIResponse(projectId, message);

		return NextResponse.json({
			success: true,
			response: aiResponse,
		});
	} catch (error) {
		console.error("Error in chat API:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}



