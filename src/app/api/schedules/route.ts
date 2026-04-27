import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { UserPayload, verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { z } from "zod";

const scheduleSchema = z.object({
  startTime: z.string(), 
  endTime: z.string(),
  userId: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    const decoded = verifyToken(token) as UserPayload;

    let schedules;

    if (decoded.role === "EMPLOYEE") {
      schedules = await prisma.schedule.findMany({
        where: { userId: decoded.id },
        include: { user: { select: { name: true, email: true } } },
        orderBy: { startTime: "asc" },
      });
    } else {
      schedules = await prisma.schedule.findMany({
        include: { user: { select: { name: true, email: true } } },
        orderBy: { startTime: "asc" },
      });
    }

    return NextResponse.json(schedules);
  } catch (error) {
    return NextResponse.json({ message: "Error al obtener horarios" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    const decoded = verifyToken(token) as UserPayload;

    const body = await request.json();

    const validation = scheduleSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: "Datos inválidos", errors: validation.error.format() },
        { status: 400 }
      );
    }

    const { startTime, endTime, userId: targetUserId } = validation.data;

    const finalUserId = decoded.role === "EMPLOYEE" ? decoded.id : (targetUserId || decoded.id);

    const conflict = await prisma.schedule.findFirst({
      where: {
        userId: finalUserId,
        status: { not: "CANCELLED" },
        AND: [
          { startTime: { lt: new Date(endTime) } },
          { endTime: { gt: new Date(startTime) } },
        ],
      },
    });

    if (conflict) {
      return NextResponse.json(
        { message: "Ya existe un horario que se cruza con este rango." },
        { status: 400 }
      );
    }

    const newSchedule = await prisma.schedule.create({
      data: {
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        userId: finalUserId,
        status: "PENDING",
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "CREATE_SCHEDULE",
        userId: decoded.id,
        details: `Se ha registrado un nuevo turno de trabajo.`,
      },
    });

    return NextResponse.json(newSchedule, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
