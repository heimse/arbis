"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ClearAllProjectsButtonProps = {
	projectsStats: {
		totalProjects: number;
		totalPlans: number;
		totalMessages: number;
		totalDocuments: number;
	};
};

export function ClearAllProjectsButton({
	projectsStats,
}: ClearAllProjectsButtonProps) {
	const router = useRouter();
	const [isDeleting, setIsDeleting] = React.useState(false);

	const handleClearAll = async () => {
		const { totalProjects, totalPlans, totalMessages, totalDocuments } =
			projectsStats;

		if (totalProjects === 0) {
			return;
		}

		// Формируем сообщение подтверждения
		let confirmMessage = `Удалить все проекты (${totalProjects})?\n\n`;
		confirmMessage += `Это также удалит:\n`;

		if (totalPlans > 0) {
			confirmMessage += `• ${totalPlans} ${
				totalPlans === 1
					? "вариант планировки"
					: totalPlans < 5
					? "варианта планировок"
					: "вариантов планировок"
			}\n`;
		}

		if (totalMessages > 0) {
			confirmMessage += `• ${totalMessages} ${
				totalMessages === 1
					? "сообщение"
					: totalMessages < 5
					? "сообщения"
					: "сообщений"
			}\n`;
		}

		if (totalDocuments > 0) {
			confirmMessage += `• ${totalDocuments} ${
				totalDocuments === 1
					? "документ"
					: totalDocuments < 5
					? "документа"
					: "документов"
			}\n`;
		}

		confirmMessage += `\nЭто действие нельзя отменить.`;

		if (!confirm(confirmMessage)) {
			return;
		}

		// Дополнительное подтверждение
		if (
			!confirm(
				"Вы уверены? Это действие удалит ВСЕ ваши проекты и связанные с ними данные без возможности восстановления!"
			)
		) {
			return;
		}

		setIsDeleting(true);
		try {
			const response = await fetch("/api/projects", {
				method: "DELETE",
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.error || "Ошибка при удалении");
			}

			// Обновляем страницу для отображения изменений
			router.refresh();
		} catch (error) {
			console.error("Ошибка при удалении всех проектов:", error);
			alert("Не удалось удалить все проекты. Попробуйте еще раз.");
			setIsDeleting(false);
		}
	};

	if (projectsStats.totalProjects === 0) {
		return null;
	}

	return (
		<Button
			variant="destructive"
			size="sm"
			onClick={handleClearAll}
			disabled={isDeleting}
			className="ml-auto"
		>
			<Trash2 className="mr-2 h-4 w-4" />
			{isDeleting ? "Удаление..." : "Очистить все"}
		</Button>
	);
}

