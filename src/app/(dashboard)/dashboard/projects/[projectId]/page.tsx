import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Editor2D } from "@/components/editor2d/Editor2D";

interface EditorPageProps {
	params: Promise<{
		projectId: string;
	}>;
}

export default async function EditorPage({ params }: EditorPageProps) {
	const session = await auth();

	if (!session?.user?.id) {
		redirect("/signin");
	}

	const { projectId } = await params;

	// Загружаем данные проекта из БД
	const project = await prisma.project.findUnique({
		where: {
			id: projectId,
		},
	});

	if (!project) {
		redirect("/dashboard");
	}

	// Проверяем, что проект принадлежит пользователю
	if (project.userId !== session.user.id) {
		redirect("/dashboard");
	}

	return <Editor2D projectId={projectId} projectName={project.title} />;
}
