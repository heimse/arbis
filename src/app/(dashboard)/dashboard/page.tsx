import * as React from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { MessageSquare, LayoutGrid, History, FolderPlus } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	getUserProjects,
	createDemoProjectForUser,
} from "@/lib/services/projects";
import { revalidatePath } from "next/cache";
import { LoadTemplatesButton } from "@/components/load-templates-button";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ClearAllProjectsButton } from "@/components/projects/ClearAllProjectsButton";

/**
 * Server Action для создания демо-проекта
 */
async function createDemoProject() {
	"use server";

	const session = await auth();
	if (!session?.user?.id) {
		throw new Error("Unauthorized");
	}

	await createDemoProjectForUser(session.user.id);
	revalidatePath("/dashboard");
}

export default async function DashboardPage() {
	const session = await auth();
	const projects = await getUserProjects(session!.user!.id);

	// Вычисляем статистику по всем проектам
	const projectsStats = {
		totalProjects: projects.length,
		totalPlans: projects.reduce((sum, p) => sum + p._count.plans, 0),
		totalMessages: projects.reduce((sum, p) => sum + p._count.messages, 0),
		totalDocuments: projects.reduce((sum, p) => sum + p._count.documents, 0),
	};

	return (
		<DashboardShell
			title="Главная страница"
			subtitle={`Добро пожаловать, ${
				session?.user?.name || session?.user?.email || "пользователь"
			}!`}
		>
			{/* Блок с проектами */}
			<div className="mb-8">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-xl font-semibold">Ваши проекты</h2>
					<ClearAllProjectsButton projectsStats={projectsStats} />
				</div>
				{projects.length === 0 ? (
					<Card>
						<CardHeader>
							<CardTitle>У вас пока нет проектов</CardTitle>
							<CardDescription>
								Создайте первый проект, чтобы начать работу с планировками
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form action={createDemoProject}>
								<Button type="submit" size="lg">
									<FolderPlus className="mr-2 h-5 w-5" />
									Создать демо-проект
								</Button>
							</form>
						</CardContent>
					</Card>
				) : (
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{projects.map((project) => (
							<ProjectCard key={project.id} project={project} />
						))}
						{/* Карточка для создания нового проекта */}
						<Card className="border-dashed hover:shadow-lg transition-shadow cursor-pointer">
							<CardHeader>
								<div className="flex flex-col items-center justify-center py-8">
									<div className="p-3 bg-primary/10 rounded-full mb-3">
										<FolderPlus className="h-8 w-8 text-primary" />
									</div>
									<CardTitle className="text-center">Новый проект</CardTitle>
								</div>
							</CardHeader>
							<CardContent>
								<form action={createDemoProject}>
									<Button type="submit" className="w-full" variant="secondary">
										Создать проект
									</Button>
								</form>
							</CardContent>
						</Card>
					</div>
				)}
			</div>

			{/* Загрузка шаблонов */}
			<div className="mb-8">
				<Card>
					<CardHeader>
						<CardTitle>Готовые планировки</CardTitle>
						<CardDescription>
							Загрузите готовые шаблоны планировок: однокомнатная,
							двухкомнатная, трехкомнатная квартиры, студия и другие варианты
						</CardDescription>
					</CardHeader>
					<CardContent>
						<LoadTemplatesButton />
					</CardContent>
				</Card>
			</div>

			{/* Быстрые действия */}
			<div>
				<h2 className="text-xl font-semibold mb-4">Быстрые действия</h2>
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					<Card className="hover:shadow-lg transition-shadow cursor-pointer">
						<CardHeader>
							<div className="flex items-center space-x-4">
								<div className="p-2 bg-primary/10 rounded-lg">
									<MessageSquare className="h-6 w-6 text-primary" />
								</div>
								<div>
									<CardTitle>Перейти в чат</CardTitle>
									<CardDescription>
										Общайтесь с AI-ассистентом планировок
									</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<Button asChild className="w-full" variant="secondary">
								<Link href="/dashboard/chat">Открыть чат</Link>
							</Button>
						</CardContent>
					</Card>

					<Card className="hover:shadow-lg transition-shadow cursor-pointer">
						<CardHeader>
							<div className="flex items-center space-x-4">
								<div className="p-2 bg-primary/10 rounded-lg">
									<LayoutGrid className="h-6 w-6 text-primary" />
								</div>
								<div>
									<CardTitle>Смотреть ваши планировки</CardTitle>
									<CardDescription>
										Просмотрите сохранённые планировки
									</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<Button asChild className="w-full" variant="secondary">
								<Link href="/dashboard/plans">Перейти к планировкам</Link>
							</Button>
						</CardContent>
					</Card>

					<Card className="hover:shadow-lg transition-shadow cursor-pointer">
						<CardHeader>
							<div className="flex items-center space-x-4">
								<div className="p-2 bg-primary/10 rounded-lg">
									<History className="h-6 w-6 text-primary" />
								</div>
								<div>
									<CardTitle>История запросов</CardTitle>
									<CardDescription>
										Все ваши предыдущие действия
									</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<Button asChild className="w-full" variant="secondary">
								<Link href="/dashboard/history">Посмотреть историю</Link>
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		</DashboardShell>
	);
}
