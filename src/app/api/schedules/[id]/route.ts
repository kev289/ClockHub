import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { UserPayload, verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    const decoded = verifyToken(token) as UserPayload;

    const body = await request.json();
    const { status } = body;

    const schedule = await prisma.schedule.findUnique({
        where: { id },
    });

    if (!schedule) {
        return NextResponse.json({ message: "Horario no encontrado" }, { status: 404 });
    }

    if (decoded.role === "EMPLOYEE" && schedule.userId !== decoded.id) {
        return NextResponse.json({ message: "No autorizado" }, { status: 403 });
    }

    const updatedSchedule = await prisma.schedule.update({
        where: { id },
        data: { status },
    });

    await prisma.auditLog.create({
        data: {
          action: "UPDATE_SCHEDULE",
          userId: decoded.id,
          details: `Horario ${id} actualizado a ${status}`,
        },
    });

    return NextResponse.json(updatedSchedule);
}

export async function GET(
    request: Request,
    { params } : { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    const decoded = verifyToken(token) as UserPayload;

    const schedule = await prisma.schedule.findUnique({
        where: { id },
        include: { user: { select: { name: true, email: true } } },
    });

    if (!schedule) return NextResponse.json({ message: "Horario no encontrado" }, { status: 404 });

    if (decoded.role === "EMPLOYEE" && schedule.userId !== decoded.id) {
        return NextResponse.json({ message: "No autorizado" }, { status: 403 });
    }

    return NextResponse.json(schedule);
}