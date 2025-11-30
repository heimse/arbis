import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Удалить все проекты пользователя
 * DELETE /api/projects
 */
export async function DELETE(request: NextRequest) {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Удаляем все проекты пользователя (связанные данные удалятся автоматически из-за onDelete: Cascade)
		const result = await prisma.project.deleteMany({
			where: {
				userId: session.user.id,
			},
		});

		return NextResponse.json({
			success: true,
			message: "All projects deleted successfully",
			deletedCount: result.count,
		});
	} catch (error) {
		console.error("Error deleting all projects:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
