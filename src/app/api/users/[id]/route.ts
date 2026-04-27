import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken, UserPayload } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    if (!token) return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    
    // SEGURIDAD: Solo usuarios ADMIN pueden editar a otros usuarios
    const decoded = verifyToken(token) as UserPayload;
    if (decoded.role !== "ADMIN") return NextResponse.json({ message: "Prohibido. Solo admins pueden realizar esta acción." }, { status: 403 });

    const { id: targetUserId } = await params;
    const body = await request.json();
    const { role, status } = body;

    // Actualizamos al usuario usando transacción para generar la auditoría al mismo tiempo
    const updatedUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: targetUserId },
        data: { 
            ...(role && { role }), 
            ...(status && { status }) 
        }
      });

      // Creamos registro de auditoría
      await tx.auditLog.create({
        data: {
          action: "UPDATE_USER",
          userId: decoded.id, // El admin que hizo la acción
          details: `El administrador actualizó los privilegios del usuario ${u.email} (Rol: ${u.role}, Status: ${u.status}).`
        }
      });

      return u;
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
