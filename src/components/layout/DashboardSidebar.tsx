"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
	Home,
	MessageSquare,
	LayoutGrid,
	History,
	FileText,
	LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggleAdvanced } from "@/components/ui/theme-toggle-advanced";

interface NavItem {
	title: string;
	href: string;
	icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
	{
		title: "Главная",
		href: "/dashboard",
		icon: Home,
	},
	{
		title: "Чат",
		href: "/dashboard/chat",
		icon: MessageSquare,
	},
	{
		title: "Варианты планировок",
		href: "/dashboard/plans",
		icon: LayoutGrid,
	},
	{
		title: "История",
		href: "/dashboard/history",
		icon: History,
	},
	{
		title: "Документы",
		href: "/dashboard/documents",
		icon: FileText,
	},
];

export function DashboardSidebar() {
	const pathname = usePathname();

	return (
		<div className="flex h-screen w-64 flex-col border-r bg-muted/40">
			<div className="flex h-14 items-center justify-between border-b px-4">
				<Link href="/dashboard" className="flex items-center space-x-2">
					<span className="font-bold text-lg">BuildPlanner</span>
				</Link>
				<ThemeToggleAdvanced />
			</div>

			<div className="px-4 py-4">
				<div className="rounded-lg border bg-card p-3">
					<p className="text-sm font-medium">Текущий проект</p>
					<p className="text-sm text-muted-foreground">демо</p>
				</div>
			</div>

			<ScrollArea className="flex-1 px-3">
				<div className="space-y-1">
					{navItems.map((item) => {
						const Icon = item.icon;
						const isActive = pathname === item.href;

						return (
							<Button
								key={item.href}
								asChild
								variant={isActive ? "secondary" : "ghost"}
								className={cn(
									"w-full justify-start",
									isActive && "bg-secondary"
								)}
							>
								<Link href={item.href}>
									<Icon className="mr-2 h-4 w-4" />
									{item.title}
								</Link>
							</Button>
						);
					})}
				</div>
			</ScrollArea>

			<div className="border-t p-4">
				<Button
					variant="ghost"
					className="w-full justify-start"
					onClick={() => signOut({ callbackUrl: "/" })}
				>
					<LogOut className="mr-2 h-4 w-4" />
					Выйти
				</Button>
			</div>
		</div>
	);
}
