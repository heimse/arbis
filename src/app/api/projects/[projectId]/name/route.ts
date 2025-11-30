import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ projectId: string }> }
) {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { projectId } = await params;
		const { title } = await request.json();

		if (!title || typeof title !== "string") {
			return NextResponse.json({ error: "Title is required" }, { status: 400 });
		}

		// Проверяем, что проект принадлежит пользователю
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

		// Обновляем название проекта
		const updatedProject = await prisma.project.update({
			where: {
				id: projectId,
			},
			data: {
				title: title.trim(),
				updatedAt: new Date(),
			},
		});

		return NextResponse.json({
			success: true,
			title: updatedProject.title,
		});
	} catch (error) {
		console.error("Error updating project name:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
