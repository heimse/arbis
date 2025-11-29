import * as React from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { LayoutGrid, Eye, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getUserPlans } from "@/lib/services/plans";
import { getUserProjects } from "@/lib/services/projects";

function getStatusBadge(status: string | null) {
	switch (status) {
		case "green":
			return (
				<Badge variant="default" className="bg-green-500">
					<CheckCircle2 className="h-3 w-3 mr-1" />
					Соответствует нормам
				</Badge>
			);
		case "yellow":
			return (
				<Badge variant="default" className="bg-yellow-500">
					<AlertCircle className="h-3 w-3 mr-1" />
					Требует внимания
				</Badge>
			);
		case "red":
			return (
				<Badge variant="destructive">
					<XCircle className="h-3 w-3 mr-1" />
					Не соответствует нормам
				</Badge>
			);
		default:
			return (
				<Badge variant="secondary">
					Не проверено
				</Badge>
			);
	}
}

export default async function PlansPage() {
	const session = await auth();
	const plans = await getUserPlans(session!.user!.id);
	const projects = await getUserProjects(session!.user!.id);

	return (
		<DashboardShell
			title="Ваши планировки"
			subtitle="Все сохранённые варианты планировок"
		>
			{projects.length === 0 ? (
				<Card>
					<CardHeader>
						<CardTitle>У вас пока нет проектов</CardTitle>
						<CardDescription>
							Создайте проект, чтобы начать создавать планировки
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button asChild>
							<Link href="/dashboard">Создать проект</Link>
						</Button>
					</CardContent>
				</Card>
			) : plans.length === 0 ? (
				<Card>
					<CardHeader>
						<CardTitle>У вас пока нет вариантов планировок</CardTitle>
						<CardDescription>
							Создайте первый вариант планировки в одном из ваших проектов
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{projects.map((project) => (
								<Button key={project.id} asChild variant="outline">
									<Link href={`/dashboard/projects/${project.id}`}>
										Открыть проект "{project.title}"
									</Link>
								</Button>
							))}
						</div>
					</CardContent>
				</Card>
			) : (
				<div className="space-y-6">
					{/* Статистика */}
					<div className="grid gap-4 md:grid-cols-3">
						<Card>
							<CardHeader className="pb-2">
								<CardDescription>Всего вариантов</CardDescription>
								<CardTitle className="text-3xl">{plans.length}</CardTitle>
							</CardHeader>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardDescription>Соответствуют нормам</CardDescription>
								<CardTitle className="text-3xl text-green-500">
									{plans.filter((p) => p.normsStatus === "green").length}
								</CardTitle>
							</CardHeader>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardDescription>Требуют внимания</CardDescription>
								<CardTitle className="text-3xl text-yellow-500">
									{plans.filter((p) => p.normsStatus === "yellow").length}
								</CardTitle>
							</CardHeader>
						</Card>
					</div>

					{/* Список вариантов планировок */}
					<div>
						<h2 className="text-xl font-semibold mb-4">Все варианты</h2>
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{plans.map((plan) => (
								<Card
									key={plan.id}
									className="hover:shadow-lg transition-shadow"
								>
									<CardHeader>
										<div className="flex items-start justify-between">
											<div className="flex-1">
												<CardTitle className="text-lg mb-1">{plan.name}</CardTitle>
												<CardDescription>
													Проект: {plan.project.title}
												</CardDescription>
											</div>
											<LayoutGrid className="h-5 w-5 text-muted-foreground" />
										</div>
									</CardHeader>
									<CardContent>
										<div className="space-y-3">
											<div className="flex items-center justify-between text-sm">
												<span className="text-muted-foreground">Версия:</span>
												<span className="font-medium">{plan.version}</span>
											</div>
											<div className="flex items-center justify-between text-sm">
												<span className="text-muted-foreground">Статус норм:</span>
												{getStatusBadge(plan.normsStatus)}
											</div>
											<div className="flex items-center justify-between text-sm">
												<span className="text-muted-foreground">Создан:</span>
												<span>
													{new Date(plan.createdAt).toLocaleDateString("ru-RU", {
														day: "numeric",
														month: "short",
														year: "numeric",
													})}
												</span>
											</div>
											<Button
												asChild
												className="w-full mt-4"
												variant="outline"
											>
												<Link href={`/dashboard/projects/${plan.projectId}`}>
													<Eye className="mr-2 h-4 w-4" />
													Открыть в редакторе
												</Link>
											</Button>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</div>
				</div>
			)}
		</DashboardShell>
	);
}

