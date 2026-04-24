import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { message: "Faltan datos obligatorios" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "El correo ya está registrado" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: "EMPLOYEE",
      },
    });

    return NextResponse.json(
      { message: "Usuario registrado con éxito", user: { id: newUser.id, email: newUser.email } },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Error al registrar el usuario" },
      { status: 500 }
    );
  }
}
