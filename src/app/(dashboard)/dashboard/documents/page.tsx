import * as React from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import {
	FileText,
	Download,
	Eye,
	File,
	Image,
	FileCheck,
	Package,
} from "lucide-react";
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
import { getUserDocuments } from "@/lib/services/documents";
import { getUserProjects } from "@/lib/services/projects";

function getDocumentIcon(type: string) {
	const icons: Record<string, React.ComponentType<{ className?: string }>> = {
		bti_plan: FileText,
		walls_drawings: Image,
		general_plan: FileCheck,
		norms_list: FileText,
		materials: Package,
		approval_package: File,
	};

	return icons[type] || File;
}

function getDocumentTypeName(type: string) {
	const names: Record<string, string> = {
		bti_plan: "План БТИ",
		walls_drawings: "Чертежи стен",
		general_plan: "Генплан",
		norms_list: "Список норм",
		materials: "Материалы",
		approval_package: "Пакет согласования",
	};

	return names[type] || type;
}

function getDocumentBadge(type: string) {
	const badges: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
		bti_plan: "default",
		walls_drawings: "secondary",
		general_plan: "default",
		norms_list: "outline",
		materials: "secondary",
		approval_package: "default",
	};

	return badges[type] || "secondary";
}

export default async function DocumentsPage() {
	const session = await auth();
	const documents = await getUserDocuments(session!.user!.id);
	const projects = await getUserProjects(session!.user!.id);

	// Группируем документы по типам
	const documentsByType = documents.reduce((acc, doc) => {
		if (!acc[doc.type]) {
			acc[doc.type] = [];
		}
		acc[doc.type].push(doc);
		return acc;
	}, {} as Record<string, typeof documents>);

	return (
		<DashboardShell
			title="Документы"
			subtitle="Все загруженные документы"
		>
			{projects.length === 0 ? (
				<Card>
					<CardHeader>
						<CardTitle>У вас пока нет проектов</CardTitle>
						<CardDescription>
							Создайте проект, чтобы начать загружать документы
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button asChild>
							<Link href="/dashboard">Создать проект</Link>
						</Button>
					</CardContent>
				</Card>
			) : documents.length === 0 ? (
				<Card>
					<CardHeader>
						<CardTitle>У вас пока нет документов</CardTitle>
						<CardDescription>
							Загрузите документы в одном из ваших проектов
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
					<div className="grid gap-4 md:grid-cols-4">
						<Card>
							<CardHeader className="pb-2">
								<CardDescription>Всего документов</CardDescription>
								<CardTitle className="text-3xl">{documents.length}</CardTitle>
							</CardHeader>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardDescription>Планы БТИ</CardDescription>
								<CardTitle className="text-3xl">
									{documentsByType["bti_plan"]?.length || 0}
								</CardTitle>
							</CardHeader>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardDescription>Чертежи</CardDescription>
								<CardTitle className="text-3xl">
									{documentsByType["walls_drawings"]?.length || 0}
								</CardTitle>
							</CardHeader>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardDescription>Другие</CardDescription>
								<CardTitle className="text-3xl">
									{documents.filter(
										(d) =>
											d.type !== "bti_plan" && d.type !== "walls_drawings"
									).length}
								</CardTitle>
							</CardHeader>
						</Card>
					</div>

					{/* Документы по типам */}
					{Object.entries(documentsByType).map(([type, docs]) => {
						const Icon = getDocumentIcon(type);
						return (
							<div key={type}>
								<h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
									<Icon className="h-5 w-5" />
									<span>{getDocumentTypeName(type)}</span>
									<Badge variant={getDocumentBadge(type)}>{docs.length}</Badge>
								</h2>
								<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
									{docs.map((doc) => (
										<Card
											key={doc.id}
											className="hover:shadow-lg transition-shadow"
										>
											<CardHeader>
												<div className="flex items-start justify-between">
													<div className="flex-1">
														<CardTitle className="text-lg mb-1">
															{getDocumentTypeName(doc.type)}
														</CardTitle>
														<CardDescription>
															Проект: {doc.project.title}
														</CardDescription>
													</div>
													<Icon className="h-5 w-5 text-muted-foreground" />
												</div>
											</CardHeader>
											<CardContent>
												<div className="space-y-3">
													<div className="flex items-center justify-between text-sm">
														<span className="text-muted-foreground">Загружен:</span>
														<span>
															{new Date(doc.createdAt).toLocaleDateString("ru-RU", {
																day: "numeric",
																month: "short",
																year: "numeric",
															})}
														</span>
													</div>
													<div className="flex space-x-2">
														<Button
															asChild
															variant="outline"
															className="flex-1"
															size="sm"
														>
															<a
																href={doc.fileUrl}
																target="_blank"
																rel="noopener noreferrer"
															>
																<Eye className="mr-2 h-4 w-4" />
																Просмотр
															</a>
														</Button>
														<Button
															asChild
															variant="outline"
															className="flex-1"
															size="sm"
														>
															<a
																href={doc.fileUrl}
																download
															>
																<Download className="mr-2 h-4 w-4" />
																Скачать
															</a>
														</Button>
													</div>
													<Button
														asChild
														variant="ghost"
														className="w-full"
														size="sm"
													>
														<Link href={`/dashboard/projects/${doc.projectId}`}>
															Открыть проект
														</Link>
													</Button>
												</div>
											</CardContent>
										</Card>
									))}
								</div>
							</div>
						);
					})}
				</div>
			)}
		</DashboardShell>
	);
}

