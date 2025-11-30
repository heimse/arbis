import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Удалить проект
 * DELETE /api/projects/[projectId]
 */
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ projectId: string }> }
) {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { projectId } = await params;

		// Проверяем, что проект существует и принадлежит пользователю
		const project = await prisma.project.findUnique({
			where: {
				id: projectId,
			},
		});

		if (!project) {
			return NextResponse.json({ error: "Project not found" }, { status: 404 });
		}

		if (project.userId !== session.user.id) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		// Удаляем проект (планы, сообщения и документы удалятся автоматически из-за onDelete: Cascade)
		await prisma.project.delete({
			where: {
				id: projectId,
			},
		});

		return NextResponse.json({
			success: true,
			message: "Project deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting project:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
