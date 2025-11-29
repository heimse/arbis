import * as React from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import {
	History,
	FolderPlus,
	MessageSquare,
	FileText,
	LayoutGrid,
	Clock,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getUserHistory } from "@/lib/services/history";
import { getUserProjects } from "@/lib/services/projects";

function getHistoryIcon(type: string) {
	switch (type) {
		case "project":
			return <FolderPlus className="h-4 w-4" />;
		case "message":
			return <MessageSquare className="h-4 w-4" />;
		case "document":
			return <FileText className="h-4 w-4" />;
		case "plan":
			return <LayoutGrid className="h-4 w-4" />;
		default:
			return <Clock className="h-4 w-4" />;
	}
}

function getHistoryBadge(type: string) {
	const badges: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
		project: { label: "Проект", variant: "default" },
		message: { label: "Сообщение", variant: "secondary" },
		document: { label: "Документ", variant: "outline" },
		plan: { label: "План", variant: "default" },
	};

	const badge = badges[type] || { label: type, variant: "secondary" as const };
	return <Badge variant={badge.variant}>{badge.label}</Badge>;
}

export default async function HistoryPage() {
	const session = await auth();
	const history = await getUserHistory(session!.user!.id);
	const projects = await getUserProjects(session!.user!.id);

	return (
		<DashboardShell
			title="История"
			subtitle="История всех ваших действий"
		>
			{projects.length === 0 ? (
				<Card>
					<CardHeader>
						<CardTitle>У вас пока нет проектов</CardTitle>
						<CardDescription>
							Создайте проект, чтобы начать работу
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button asChild>
							<Link href="/dashboard">Создать проект</Link>
						</Button>
					</CardContent>
				</Card>
			) : history.length === 0 ? (
				<Card>
					<CardHeader>
						<CardTitle>История пуста</CardTitle>
						<CardDescription>
							Здесь будет отображаться история всех ваших действий
						</CardDescription>
					</CardHeader>
				</Card>
			) : (
				<div className="space-y-6">
					{/* Статистика */}
					<div className="grid gap-4 md:grid-cols-4">
						<Card>
							<CardHeader className="pb-2">
								<CardDescription>Всего событий</CardDescription>
								<CardTitle className="text-3xl">{history.length}</CardTitle>
							</CardHeader>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardDescription>Проекты</CardDescription>
								<CardTitle className="text-3xl">
									{history.filter((h) => h.type === "project").length}
								</CardTitle>
							</CardHeader>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardDescription>Сообщения</CardDescription>
								<CardTitle className="text-3xl">
									{history.filter((h) => h.type === "message").length}
								</CardTitle>
							</CardHeader>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardDescription>Планы</CardDescription>
								<CardTitle className="text-3xl">
									{history.filter((h) => h.type === "plan").length}
								</CardTitle>
							</CardHeader>
						</Card>
					</div>

					{/* История действий */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center space-x-2">
								<History className="h-5 w-5" />
								<span>Хронология действий</span>
							</CardTitle>
							<CardDescription>
								Все действия отсортированы по дате (новые первыми)
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ScrollArea className="h-[600px] pr-4">
								<div className="space-y-4">
									{history.map((item) => (
										<div
											key={item.id}
											className="flex items-start space-x-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
										>
											<div className="flex-shrink-0 mt-1">
												<div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
													{getHistoryIcon(item.type)}
												</div>
											</div>
											<div className="flex-1 min-w-0">
												<div className="flex items-center justify-between mb-1">
													<div className="flex items-center space-x-2">
														<span className="font-medium">{item.action}</span>
														{getHistoryBadge(item.type)}
													</div>
													<span className="text-xs text-muted-foreground">
														{new Date(item.createdAt).toLocaleDateString("ru-RU", {
															day: "numeric",
															month: "short",
															year: "numeric",
															hour: "2-digit",
															minute: "2-digit",
														})}
													</span>
												</div>
												<p className="text-sm text-muted-foreground mb-2">
													{item.description}
												</p>
												{item.projectId && (
													<Button
														asChild
														variant="ghost"
														size="sm"
														className="h-7"
													>
														<Link href={`/dashboard/projects/${item.projectId}`}>
															Открыть проект
														</Link>
													</Button>
												)}
											</div>
										</div>
									))}
								</div>
							</ScrollArea>
						</CardContent>
					</Card>
				</div>
			)}
		</DashboardShell>
	);
}

