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

    if (decoded.role !== "ADMIN") {
      return NextResponse.json({ message: "Acceso prohibido: Solo Admins" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, status: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
