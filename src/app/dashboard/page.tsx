"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  
  // Estados de Datos
  const [activeTab, setActiveTab] = useState("schedules");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados del Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [formError, setFormError] = useState("");

  // 1. Cargar datos dinámicamente
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const endpoint = 
          activeTab === "schedules" ? "/api/schedules" :
          activeTab === "users" ? "/api/users" : 
          "/api/audit";
        
        const res = await fetch(endpoint);
        const result = await res.json();
        setData(Array.isArray(result) ? result : []);
      } catch (err) {
        console.error("Error al cargar datos", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  // 2. Función para CREAR horario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    try {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startTime, endTime }),
      });

      const result = await res.json();

      if (res.ok) {
        setIsModalOpen(false);
        setStartTime("");
        setEndTime("");
        // Refrescamos la tabla
        setActiveTab("");
        setTimeout(() => setActiveTab("schedules"), 10);
      } else {
        setFormError(result.message || "Error al crear el horario");
      }
    } catch (err) {
      setFormError("Error de conexión");
    }
  };

  // 3. Función para CANCELAR horario
  const handleCancel = async (id: string) => {
    if (!confirm("¿Seguro que quieres cancelar este horario?")) return;
    try {
      const res = await fetch(`/api/schedules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (res.ok) {
        setActiveTab(""); 
        setTimeout(() => setActiveTab("schedules"), 10);
      }
    } catch (err) {
      alert("Error al cancelar");
    }
  };

  return (
    <div className="flex min-h-screen bg-black text-gray-100">
      {/* SIDEBAR */}
      <aside className="w-64 bg-zinc-950 border-r border-red-900/30 flex flex-col p-6 shrink-0 shadow-2xl z-10">
        <h1 className="text-3xl font-black mb-10 tracking-tighter text-red-600 italic">ClockHub</h1>
        
        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setActiveTab("schedules")}
            className={`w-full text-left px-4 py-3 rounded-lg transition-all ${activeTab === "schedules" ? "bg-red-600 text-white font-bold shadow-lg shadow-red-600/20" : "hover:bg-red-600/10 text-gray-400"}`}
          >
            Horarios
          </button>

          {user?.role !== "EMPLOYEE" && (
            <button 
              onClick={() => setActiveTab("audit")}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all ${activeTab === "audit" ? "bg-red-600 text-white font-bold" : "hover:bg-red-600/10 text-gray-400"}`}
            >
              Auditoría
            </button>
          )}

          {user?.role === "ADMIN" && (
            <button 
              onClick={() => setActiveTab("users")}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all ${activeTab === "users" ? "bg-red-600 text-white font-bold" : "hover:bg-red-600/10 text-gray-400"}`}
            >
              Usuarios
            </button>
          )}
        </nav>

        <div className="pt-6 border-t border-red-900/30">
          <div className="mb-4">
            <p className="text-sm font-bold text-white truncate">{user?.name || "Usuario"}</p>
            <p className="text-xs text-red-500/80 truncate mt-1">{user?.email}</p>
          </div>
          <button onClick={logout} className="w-full bg-transparent border border-red-600 text-red-600 hover:bg-red-600 hover:text-white py-2 rounded-lg transition-all text-sm font-bold uppercase tracking-widest">
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-10 overflow-auto bg-black relative">
        <header className="mb-10 flex justify-between items-end">
            <div>
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter">
                    {activeTab === "schedules" ? "Gestión de Horarios" : activeTab === "users" ? "Directorio" : "Auditoría"}
                </h2>
                <div className="h-1 w-20 bg-red-600 mt-2"></div>
            </div>
            {activeTab === "schedules" && (
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-600/20"
                >
                    + Nuevo Registro
                </button>
            )}
        </header>

        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
        ) : (
          <div className="bg-zinc-900/50 border border-red-900/20 rounded-xl overflow-hidden backdrop-blur-sm shadow-2xl">
            <table className="w-full text-left">
              <thead className="bg-zinc-950 text-red-500 text-[10px] uppercase font-black tracking-[0.2em]">
                {activeTab === "schedules" ? (
                  <tr>
                    <th className="px-6 py-4">Usuario</th>
                    <th className="px-6 py-4">Entrada</th>
                    <th className="px-6 py-4">Salida</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                ) : activeTab === "users" ? (
                  <tr>
                    <th className="px-6 py-4">Nombre</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Rol</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="px-6 py-4">Usuario</th>
                    <th className="px-6 py-4">Acción</th>
                    <th className="px-6 py-4 w-1/3">Info</th>
                    <th className="px-6 py-4">Fecha</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-red-900/10 text-gray-300 bg-zinc-900/30">
                {data.map((item) => (
                    <tr key={item.id} className="hover:bg-red-600/5 transition-colors border-b border-red-900/5">
                        {activeTab === "schedules" ? (
                            <>
                                <td className="px-6 py-4 font-bold text-white">{item.user?.name}</td>
                                <td className="px-6 py-4 text-xs font-mono">{new Date(item.startTime).toLocaleString()}</td>
                                <td className="px-6 py-4 text-xs font-mono">{new Date(item.endTime).toLocaleString()}</td>
                                <td className="px-6 py-4 text-black">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase border ${item.status === 'APPROVED' ? 'border-green-500 text-green-500 bg-green-500/10' : item.status === 'PENDING' ? 'border-yellow-500 text-yellow-500 bg-yellow-500/10' : 'border-red-600 text-red-600 bg-red-600/10'}`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {item.status !== "CANCELLED" && (
                                        <button onClick={() => handleCancel(item.id)} className="text-red-500 hover:text-red-400 text-[10px] font-black uppercase tracking-widest underline transition-colors">Cancelar</button>
                                    )}
                                </td>
                            </>
                        ) : activeTab === "users" ? (
                            <>
                                <td className="px-6 py-4 font-bold text-white">{item.name}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{item.email}</td>
                                <td className="px-6 py-4"><span className="text-red-500 text-[10px] font-black uppercase border border-red-500/30 px-2 py-0.5 rounded">{item.role}</span></td>
                                <td className="px-6 py-4 text-[10px] font-bold text-gray-600 uppercase">{item.status}</td>
                            </>
                        ) : (
                            <>
                                <td className="px-6 py-4 font-bold text-white">{item.user?.name}</td>
                                <td className="px-6 py-4"><span className="text-red-600 text-[10px] font-mono font-bold uppercase">{item.action}</span></td>
                                <td className="px-6 py-4 text-xs text-gray-500 italic font-medium">"{item.details}"</td>
                                <td className="px-6 py-4 text-[10px] text-gray-500 font-mono italic">{new Date(item.timestamp).toLocaleString()}</td>
                            </>
                        )}
                    </tr>
                ))}
              </tbody>
            </table>
            {data.length === 0 && (
                <div className="p-20 text-center flex flex-col items-center gap-2 border-t border-red-900/10 bg-zinc-950/20">
                    <p className="text-gray-700 font-black italic tracking-[0.3em] uppercase text-xs">Sin Registros Encontrados</p>
                </div>
            )}
          </div>
        )}

        {/* MODAL PARA NUEVO HORARIO */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
            <div className="bg-zinc-950 border border-red-600/50 p-8 rounded-2xl w-full max-w-md shadow-[0_0_50px_rgba(220,38,38,0.15)] transform animate-in fade-in zoom-in duration-300">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Nuevo Horario</h3>
              </div>
              
              {formError && (
                <div className="bg-red-600/10 border border-red-600 text-red-500 p-3 mb-6 rounded text-xs font-black uppercase tracking-widest text-center shadow-lg">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-red-600 uppercase tracking-[0.2em] mb-2">Entrada</label>
                  <input 
                    type="datetime-local" 
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-zinc-900 border border-red-900/30 rounded-lg p-3 text-white focus:border-red-600 outline-none transition-all placeholder-gray-700 font-mono text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-red-600 uppercase tracking-[0.2em] mb-2">Salida</label>
                  <input 
                    type="datetime-local" 
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-zinc-900 border border-red-900/30 rounded-lg p-3 text-white focus:border-red-600 outline-none transition-all placeholder-gray-700 font-mono text-sm"
                    required
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-3 border border-zinc-800 text-zinc-500 font-black rounded-lg hover:bg-zinc-900 transition-all uppercase text-[10px] tracking-widest shadow-xl"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 px-4 py-3 bg-red-600 text-white font-black rounded-lg hover:bg-red-700 transition-all uppercase text-[10px] tracking-widest shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:scale-[1.02]"
                  >
                    Crear Horario
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
