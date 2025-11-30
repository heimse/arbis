"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutGrid, Eye, Trash2 } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";

type Plan = {
	id: string;
	name: string;
	version: number;
	normsStatus: string | null;
	createdAt: Date | string;
	projectId: string;
	project: {
		id: string;
		title: string;
		type: string | null;
		area: number | null;
	};
};

type PlanCardProps = {
	plan: Plan;
};

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
			return <Badge variant="secondary">Не проверено</Badge>;
	}
}

export function PlanCard({ plan }: PlanCardProps) {
	const router = useRouter();
	const [isDeleting, setIsDeleting] = React.useState(false);

	const handleDelete = async () => {
		if (
			!confirm(
				`Удалить планировку "${plan.name}"? Это действие нельзя отменить.`
			)
		) {
			return;
		}

		setIsDeleting(true);
		try {
			const response = await fetch(`/api/plans/${plan.id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.error || "Ошибка при удалении");
			}

			// Обновляем страницу для отображения изменений
			router.refresh();
		} catch (error) {
			console.error("Ошибка при удалении планировки:", error);
			alert("Не удалось удалить планировку. Попробуйте еще раз.");
			setIsDeleting(false);
		}
	};

	return (
		<Card className="hover:shadow-lg transition-shadow">
			<CardHeader>
				<div className="flex items-start justify-between">
					<div className="flex-1">
						<CardTitle className="text-lg mb-1">{plan.name}</CardTitle>
						<CardDescription>Проект: {plan.project.title}</CardDescription>
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
					<div className="flex gap-2 mt-4">
						<Button asChild className="flex-1" variant="outline">
							<Link href={`/dashboard/projects/${plan.projectId}`}>
								<Eye className="mr-2 h-4 w-4" />
								Открыть
							</Link>
						</Button>
						<Button
							variant="outline"
							size="icon"
							onClick={handleDelete}
							disabled={isDeleting}
							className="text-destructive hover:text-destructive hover:bg-destructive/10"
							title="Удалить планировку"
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

