import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

// 1. Definimos qué datos esperamos (Contrato)
const taskSchema = z.object({
    title: z.string().min(3, "Mínimo 3 caracteres"),
    isCritical: z.boolean().default(false)
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        // 2. Extraer el ID del horario de la URL
        const { id: scheduleId } = await params;

        // 3. Obtener y Validar los datos del cuerpo
        const body = await request.json();
        const validation = taskSchema.safeParse(body);

        if (!validation.success) {
            // validation.error.format() nos da un objeto más limpio
            return NextResponse.json({
                message: "Datos inválidos",
                errors: validation.error.flatten().fieldErrors
            }, { status: 400 });
        }


        // 4. Extraer datos limpios
        const { title, isCritical } = validation.data;

        // 5. OPERACIÓN ATÓMICA (CRUD Anidado que altera al principal)
        const result = await prisma.$transaction(async (tx) => {
            // Creamos la tarea
            const newTask = await tx.task.create({
                data: { title, isCritical, scheduleId }
            });

            // SI LA TAREA ES CRÍTICA: Alteramos el horario padre a 'PENDING'
            if (isCritical) {
                await tx.schedule.update({
                    where: { id: scheduleId },
                    data: { status: "PENDING" }
                });
            }

            return newTask;
        });

        return NextResponse.json(result, { status: 201 });

    } catch (error) {
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
