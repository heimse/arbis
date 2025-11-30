import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Удалить версию планировки
 * DELETE /api/plans/[planId]
 */
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ planId: string }> }
) {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { planId } = await params;

		// Проверяем, что планировка существует и принадлежит пользователю
		const plan = await prisma.planVersion.findFirst({
			where: {
				id: planId,
				project: {
					userId: session.user.id,
				},
			},
			include: {
				project: true,
			},
		});

		if (!plan) {
			return NextResponse.json({ error: "Plan not found" }, { status: 404 });
		}

		// Удаляем планировку
		await prisma.planVersion.delete({
			where: {
				id: planId,
			},
		});

		return NextResponse.json({
			success: true,
			message: "Plan deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting plan:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
