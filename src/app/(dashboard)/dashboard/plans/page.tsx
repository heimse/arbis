import * as React from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/DashboardShell";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getUserPlans } from "@/lib/services/plans";
import { getUserProjects } from "@/lib/services/projects";
import { PlanCard } from "@/components/plans/PlanCard";

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
								<PlanCard key={plan.id} plan={plan} />
							))}
						</div>
					</div>
				</div>
			)}
		</DashboardShell>
	);
}
