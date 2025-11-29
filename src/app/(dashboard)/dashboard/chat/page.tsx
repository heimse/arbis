import * as React from "react";
import { auth } from "@/lib/auth";
import { MessageSquare } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { getProjectMessages } from "@/lib/services/messages";
import { getUserProjects } from "@/lib/services/projects";
import Link from "next/link";

export default async function ChatPage({
	searchParams,
}: {
	searchParams: { projectId?: string };
}) {
	const session = await auth();
	const projects = await getUserProjects(session!.user!.id);
	const selectedProjectId = searchParams.projectId || projects[0]?.id;

	// Получаем сообщения выбранного проекта
	const messages = selectedProjectId
		? await getProjectMessages(selectedProjectId, session!.user!.id)
		: [];

	const selectedProject = projects.find((p) => p.id === selectedProjectId);

	return (
		<DashboardShell
			title="Чат"
			subtitle="Общайтесь с AI-ассистентом планировок"
		>
			{projects.length === 0 ? (
				<Card>
					<CardHeader>
						<CardTitle>У вас пока нет проектов</CardTitle>
						<CardDescription>
							Создайте проект, чтобы начать общение с AI-ассистентом
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button asChild>
							<Link href="/dashboard">Создать проект</Link>
						</Button>
					</CardContent>
				</Card>
			) : (
				<div className="flex flex-col h-[calc(100vh-12rem)]">
					{/* Выбор проекта */}
					{projects.length > 1 && (
						<div className="mb-4 flex flex-wrap gap-2">
							{projects.map((project) => (
								<Button
									key={project.id}
									variant={selectedProjectId === project.id ? "default" : "outline"}
									asChild
									size="sm"
								>
									<Link href={`/dashboard/chat?projectId=${project.id}`}>
										<MessageSquare className="h-4 w-4 mr-2" />
										{project.title}
									</Link>
								</Button>
							))}
						</div>
					)}

					{/* Интерфейс чата */}
					<Card className="flex-1 flex flex-col">
						<CardHeader>
							<CardTitle className="flex items-center space-x-2">
								<MessageSquare className="h-5 w-5" />
								<span>
									{selectedProject
										? `Чат: ${selectedProject.title}`
										: "Выберите проект"}
								</span>
							</CardTitle>
							<CardDescription>
								Общайтесь с AI-ассистентом о планировке проекта
							</CardDescription>
						</CardHeader>
						<CardContent className="flex-1 flex flex-col min-h-0">
							{selectedProjectId ? (
								<ChatInterface
									projectId={selectedProjectId}
									initialMessages={messages.map((msg) => ({
										id: msg.id,
										role: msg.role as "user" | "assistant" | "system",
										content: msg.content,
										createdAt: msg.createdAt,
									}))}
								/>
							) : (
								<div className="flex items-center justify-center h-full">
									<p className="text-muted-foreground">
										Выберите проект для начала общения
									</p>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			)}
		</DashboardShell>
	);
}
