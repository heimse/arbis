"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Project = {
	id: string;
	title: string;
	type: string | null;
	area: number | null;
	_count: {
		plans: number;
		messages: number;
		documents: number;
	};
};

type ProjectCardProps = {
	project: Project;
};

export function ProjectCard({ project }: ProjectCardProps) {
	const router = useRouter();
	const [isDeleting, setIsDeleting] = React.useState(false);

	const handleDelete = async (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		const plansCount = project._count.plans;
		const messagesCount = project._count.messages;
		const documentsCount = project._count.documents;

		const totalItems = plansCount + messagesCount + documentsCount;

		let confirmMessage = `Удалить проект "${project.title}"?`;
		if (totalItems > 0) {
			confirmMessage += `\n\nЭто также удалит:\n`;
			if (plansCount > 0) {
				confirmMessage += `• ${plansCount} ${
					plansCount === 1
						? "вариант планировки"
						: plansCount < 5
						? "варианта планировок"
						: "вариантов планировок"
				}\n`;
			}
			if (messagesCount > 0) {
				confirmMessage += `• ${messagesCount} ${
					messagesCount === 1
						? "сообщение"
						: messagesCount < 5
						? "сообщения"
						: "сообщений"
				}\n`;
			}
			if (documentsCount > 0) {
				confirmMessage += `• ${documentsCount} ${
					documentsCount === 1
						? "документ"
						: documentsCount < 5
						? "документа"
						: "документов"
				}\n`;
			}
			confirmMessage += `\nЭто действие нельзя отменить.`;
		} else {
			confirmMessage += `\n\nЭто действие нельзя отменить.`;
		}

		if (!confirm(confirmMessage)) {
			return;
		}

		setIsDeleting(true);
		try {
			const response = await fetch(`/api/projects/${project.id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.error || "Ошибка при удалении");
			}

			// Обновляем страницу для отображения изменений
			router.refresh();
		} catch (error) {
			console.error("Ошибка при удалении проекта:", error);
			alert("Не удалось удалить проект. Попробуйте еще раз.");
			setIsDeleting(false);
		}
	};

	return (
		<Card className="hover:shadow-lg transition-shadow">
			<CardHeader>
				<CardTitle className="flex items-center justify-between">
					<span className="truncate flex-1">{project.title}</span>
					<Button
						variant="ghost"
						size="icon"
						onClick={handleDelete}
						disabled={isDeleting}
						className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 ml-2 flex-shrink-0"
						title="Удалить проект"
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				</CardTitle>
				<CardDescription>
					{project.type === "apartment" && "Квартира"}
					{project.type === "house" && "Дом"}
					{project.type === "office" && "Офис"}
					{!project.type && "Проект"}
					{project.area && ` • ${project.area} м²`}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
					<span>{project._count.plans} вариантов</span>
					<span>{project._count.messages} сообщений</span>
				</div>
				<Button asChild className="w-full" variant="outline">
					<Link href={`/dashboard/projects/${project.id}`}>Открыть проект</Link>
				</Button>
			</CardContent>
		</Card>
	);
}

