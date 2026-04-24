import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { UserPayload, verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    const decoded = verifyToken(token) as UserPayload;

    // Solo ADMIN y MANAGER pueden ver auditoría
    if (decoded.role === "EMPLOYEE") {
      return NextResponse.json({ message: "Acceso denegado" }, { status: 403 });
    }

    const logs = await prisma.auditLog.findMany({
      include: { user: { select: { name: true, role: true } } },
      orderBy: [{ timestamp: "desc" }],
    });

    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
