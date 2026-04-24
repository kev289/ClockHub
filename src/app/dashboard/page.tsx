"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [schedules, setSchedules] = useState([]);

  // 1. Cargar los horarios al entrar
  useEffect(() => {
    fetch("/api/schedules")
      .then((res) => res.json())
      .then((data) => setSchedules(data));
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Barra de Navegación */}
      <nav className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-indigo-600">ClockHub Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {user?.name} ({user?.role})
          </span>
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-all"
          >
            Cerrar Sesión
          </button>
        </div>
      </nav>

      <main className="p-8 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Resumen de Horarios</h2>
          
          {/* Botón condicional: Empleado no puede crear, Managers y Admins sí */}
          {user?.role !== "EMPLOYEE" && (
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all">
              + Crear Nuevo Horario
            </button>
          )}
        </div>

        {/* Tabla de Horarios */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Usuario</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Inicio</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Fin</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {schedules.map((s: any) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors text-black">
                  <td className="px-6 py-4">{s.user?.name}</td>
                  <td className="px-6 py-4">{new Date(s.startTime).toLocaleString()}</td>
                  <td className="px-6 py-4">{new Date(s.endTime).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      s.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
              {schedules.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No hay horarios registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
