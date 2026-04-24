"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                router.push("/login");
            } else {
                setError(data.message || "Error al registrar");
            }
        } catch (err) {
            setError("Ocurrió un error en la conexión");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black p-4">
            <div className="bg-zinc-950 border border-red-900/30 p-8 rounded-2xl shadow-2xl w-full max-w-md transform transition-all hover:scale-[1.01]">
                <h1 className="text-4xl font-black text-red-600 text-center mb-2 uppercase tracking-tighter italic">ClockHub</h1>
                <p className="text-gray-500 text-center mb-8 font-medium">Crear cuenta corporativa</p>

                {error && (
                    <div className="bg-red-950/50 border border-red-600 text-red-500 p-3 mb-6 rounded text-sm text-center font-bold">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-black text-red-500 mb-1 uppercase tracking-widest">Nombre</label>
                        <input
                            type="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="text-white bg-zinc-900 w-full px-4 py-3 rounded-lg border border-red-900/50 focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition-all placeholder-gray-600"
                            placeholder="Tu nombre completo"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-red-500 mb-1 uppercase tracking-widest">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="text-white bg-zinc-900 w-full px-4 py-3 rounded-lg border border-red-900/50 focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition-all placeholder-gray-600"
                            placeholder="tu@email.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-black text-red-500 mb-1 uppercase tracking-widest">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="text-white bg-zinc-900 w-full px-4 py-3 rounded-lg border border-red-900/50 focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition-all placeholder-gray-600"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-lg shadow-lg hover:shadow-red-600/30 transition-all duration-300 uppercase tracking-widest mt-4"
                    >
                        Completar Registro
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-gray-500">
                    ¿Ya tienes cuenta?{" "}
                    <Link href="/login" className="text-red-500 font-bold hover:text-red-400 transition-colors">
                        Inicia Sesión
                    </Link>
                </p>
            </div>
        </div>
    );
}