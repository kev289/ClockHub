import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken, UserPayload } from "@/lib/auth";

// 1. Definimos qué datos esperamos (Contrato)
const taskSchema = z.object({
    title: z.string().min(3, "Mínimo 3 caracteres"),
    isCritical: z.boolean().default(false)
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: scheduleId } = await params;
        
        // SEGURIDAD: Verificar quién hace la acción
        const cookieStore = await cookies();
        const token = cookieStore.get("auth-token")?.value;
        if (!token) return NextResponse.json({ message: "No autorizado" }, { status: 401 });
        const decoded = verifyToken(token) as UserPayload;

        const body = await request.json();
        const validation = taskSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                message: "Datos inválidos",
                errors: validation.error.flatten().fieldErrors
            }, { status: 400 });
        }

        const { title, isCritical } = validation.data;

        // OPERACIÓN ATÓMICA
        const result = await prisma.$transaction(async (tx) => {
            // 1. Creamos la tarea
            const newTask = await tx.task.create({
                data: { title, isCritical, scheduleId }
            });

            // 2. Si es crítica, alteramos el horario
            if (isCritical) {
                await tx.schedule.update({
                    where: { id: scheduleId },
                    data: { status: "PENDING" }
                });
            }

            // 3. REGISTRAR EN AUDITORÍA (Humanizado)
            await tx.auditLog.create({
                data: {
                    action: "CREATE_TASK",
                    userId: decoded.id,
                    details: `Se añadió la tarea "${title}" al turno (Prioridad: ${isCritical ? 'Alta/Crítica' : 'Normal'}).`
                }
            });

            return newTask;
        });

        return NextResponse.json(result, { status: 201 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Error interno" }, { status: 500 });
    }
}

// Extra: GET para poder ver las tareas después
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id: scheduleId } = await params;
    const tasks = await prisma.task.findMany({
        where: { scheduleId },
        orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(tasks);
}
