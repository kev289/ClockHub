import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { UserPayload, verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

// --- GET: Listar horarios (Con filtro por Rol) ---
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    const decoded = verifyToken(token) as UserPayload;

    let schedules;

    // RBAC: Los empleados solo ven los suyos, Admins y Managers ven todos
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

// --- POST: Crear horario (Con detección de conflictos y Auditoría) ---
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    const decoded = verifyToken(token) as UserPayload;

    const { startTime, endTime, userId: targetUserId } = await request.json();

    // Validar que un Employee no intente crear horarios para otros (Seguridad RBAC)
    const finalUserId = decoded.role === "EMPLOYEE" ? decoded.id : (targetUserId || decoded.id);

    // 1. Detectar conflictos
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
        { message: "Conflicto de horario: El usuario ya tiene un turno en este rango." },
        { status: 400 }
      );
    }

    // 2. Crear el horario
    const newSchedule = await prisma.schedule.create({
      data: {
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        userId: finalUserId,
        status: "PENDING",
      },
    });

    // 3. REGISTRO DE AUDITORÍA (Obligatorio en tu simulacro)
    await prisma.auditLog.create({
      data: {
        action: "CREATE_SCHEDULE",
        userId: decoded.id, // Quién hizo la acción
        details: `Horario creado para el usuario ${finalUserId} desde ${startTime} hasta ${endTime}`,
      },
    });

    return NextResponse.json(newSchedule, { status: 201 });
  } catch (error) {
     console.error(error);
    return NextResponse.json({ message: "Error al crear el horario" }, { status: 500 });
  }
}
