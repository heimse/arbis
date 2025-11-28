import * as React from "react";
import { cn } from "@/lib/utils/cn";

interface DashboardShellProps {
	children: React.ReactNode;
	title?: string;
	subtitle?: string;
	className?: string;
}

export function DashboardShell({
	children,
	title,
	subtitle,
	className,
}: DashboardShellProps) {
	return (
		<div className={cn("flex-1 space-y-4 p-8 pt-6", className)}>
			{(title || subtitle) && (
				<div className="flex items-center justify-between space-y-2">
					<div>
						{title && (
							<h2 className="text-3xl font-bold tracking-tight">{title}</h2>
						)}
						{subtitle && <p className="text-muted-foreground">{subtitle}</p>}
					</div>
				</div>
			)}
			{children}
		</div>
	);
}
