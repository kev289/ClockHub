import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET
);

// CAMBIA EL NOMBRE DE LA FUNCIÓN AQUÍ: de middleware a proxy
export async function proxy(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;

  if (!token && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      
      if (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } catch (error) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("auth-token");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
