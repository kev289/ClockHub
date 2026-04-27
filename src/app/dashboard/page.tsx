"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { user, logout } = useAuth();

  // Estados de Datos Principales
  const [activeTab, setActiveTab] = useState("schedules");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados del CRUD de Horarios
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [formError, setFormError] = useState("");

  // ESTADOS DEL CRUD ANIDADO (TAREAS)
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [isCritical, setIsCritical] = useState(false);
  const [isTaskLoading, setIsTaskLoading] = useState(false);

  // 1. Cargar datos dinámicamente
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

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // 2. Funciones CRUD Horarios
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const res = await fetch("/api/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startTime, endTime }),
    });
    if (res.ok) {
      setIsModalOpen(false);
      fetchData();
    } else {
      const result = await res.json();
      setFormError(result.message || "Error");
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("¿Cancelar horario?")) return;
    await fetch(`/api/schedules/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    fetchData();
  };

  // 3. FUNCIONES CRUD ANIDADO (TAREAS)
  const fetchTasks = async (scheduleId: string) => {
    setSelectedScheduleId(scheduleId);
    setIsTaskLoading(true);
    const res = await fetch(`/api/schedules/${scheduleId}/tasks`);
    const result = await res.json();
    setTasks(result);
    setIsTaskLoading(false);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) return;
    const res = await fetch(`/api/schedules/${selectedScheduleId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: taskTitle, isCritical }),
    });
    if (res.ok) {
      setTaskTitle("");
      setIsCritical(false);
      fetchTasks(selectedScheduleId!);
      fetchData();
    }
  };

  const toggleTask = async (taskId: string, currentStatus: boolean) => {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCompleted: !currentStatus }),
    });

    if (res.ok) {
      // Refrescamos las tareas del horario actual
      fetchTasks(selectedScheduleId!);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm("¿Deseas eliminar esta tarea?")) return;
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      fetchTasks(selectedScheduleId!);
    }
  };

  const updateUser = async (userId: string, targetRole?: string, targetStatus?: string) => {
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: targetRole, status: targetStatus }),
    });
    if (res.ok) {
      fetchData();
    }
  };

  return (
    <div className="flex min-h-screen bg-black text-gray-100 overflow-hidden font-sans">
      {/* SIDEBAR CON RBAC VISUAL */}
      <aside className="w-64 bg-zinc-950 border-r border-red-900/30 flex flex-col p-6 shrink-0 shadow-2xl z-20">
        <h1 className="text-3xl font-black mb-10 tracking-tighter text-red-600 italic">ClockHub</h1>
        <nav className="flex-1 space-y-2">
          {["schedules", "audit", "users"].map((tab) => {
            // LÓGICA RBAC: Ocultar pestañas según rol
            if (user?.role === "EMPLOYEE" && (tab === "audit" || tab === "users")) return null;
            if (user?.role === "MANAGER" && tab === "users") return null;

            return (
              <button key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all capitalize border ${activeTab === tab ? "bg-red-600 text-white font-bold border-red-600" : "text-gray-400 hover:bg-red-600/10 border-transparent"}`}
              >
                {tab === "schedules" ? "Horarios" : tab === "audit" ? "Auditoría" : "Usuarios"}
              </button>
            );
          })}
        </nav>
        <div className="pt-6 border-t border-red-900/30">
          <p className="text-sm font-bold text-white truncate">{user?.name || "Usuario"}</p>
          <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">{user?.role}</p>
          <button onClick={logout} className="w-full mt-4 bg-transparent border border-red-600 text-red-600 hover:bg-red-600 hover:text-white py-2 rounded-lg transition-all text-xs font-black uppercase">
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* CUERPO PRINCIPAL */}
      <main className="flex-1 p-10 overflow-auto bg-black relative">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter">
              {activeTab === "schedules" ? "Gestión de Horarios" : activeTab === "users" ? "Directorio de Usuarios" : "Registro de Auditoría"}
            </h2>
            <div className="h-1 w-20 bg-red-600 mt-2"></div>
          </div>
          {activeTab === "schedules" && (
            <button onClick={() => setIsModalOpen(true)} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-black text-xs uppercase tracking-widest transition-all">
              + Nuevo Horario
            </button>
          )}
        </header>

        {loading ? <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mt-20"></div> : (
          <div className="bg-zinc-900/50 border border-red-900/20 rounded-xl overflow-hidden backdrop-blur-sm shadow-2xl">
            <table className="w-full text-left">
              <thead className="bg-zinc-950 text-red-500 text-[10px] uppercase font-black tracking-[0.2em]">
                <tr>
                  {activeTab === "schedules" ? (
                    <>
                      <th className="px-6 py-4">Usuario</th>
                      <th className="px-6 py-4">Intervalo</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                    </>
                  ) : activeTab === "audit" ? (
                    <>
                      <th className="px-6 py-4">Usuario</th>
                      <th className="px-6 py-4">Acción</th>
                      <th className="px-6 py-4">Detalles</th>
                      <th className="px-6 py-4 text-right">Fecha</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-4">Nombre</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Rol</th>
                      <th className="px-6 py-4 text-right">Estado</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-red-900/10 text-gray-300">
                {data.map((item) => (
                  <tr key={item.id} className="hover:bg-red-600/5 transition-colors text-sm">
                    {activeTab === "schedules" ? (
                      <>
                        <td className="px-6 py-4 font-bold text-white">{item.user?.name}</td>
                        <td className="px-6 py-4 text-[10px] font-mono">
                          {new Date(item.startTime).toLocaleTimeString()} - {new Date(item.endTime).toLocaleTimeString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase border ${item.status === 'APPROVED' ? 'border-green-500 text-green-500 bg-green-500/10' : 'border-red-600 text-red-600 bg-red-600/10'}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-4">
                          <button onClick={() => fetchTasks(item.id)} className="text-blue-500 hover:text-blue-400 text-[10px] font-black uppercase underline">Tareas</button>
                          {item.status !== "CANCELLED" && (
                            <button onClick={() => handleCancel(item.id)} className="text-red-500 hover:text-red-400 text-[10px] font-black uppercase underline">Cancelar</button>
                          )}
                        </td>
                      </>
                    ) : activeTab === "audit" ? (
                      <>
                        <td className="px-6 py-4 font-bold text-white">{item.user?.name || "Sistema"}</td>
                        <td className="px-6 py-4 text-red-500 font-black text-[9px] uppercase tracking-widest">{item.action}</td>
                        <td className="px-6 py-4 text-xs italic text-gray-500 truncate max-w-xs">{item.details}</td>
                        <td className="px-6 py-4 text-right text-[10px] font-mono">{new Date(item.timestamp).toLocaleString()}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 font-bold text-white">{item.name}</td>
                        <td className="px-6 py-4 text-xs text-zinc-500">{item.email}</td>
                        <td className="px-6 py-4 text-red-500 font-black text-[9px]">
                          <select 
                            value={item.role} 
                            onChange={(e) => updateUser(item.id, e.target.value, item.status)}
                            disabled={user?.role !== "ADMIN"}
                            className="bg-transparent border-b border-red-900/50 outline-none cursor-pointer disabled:cursor-not-allowed"
                          >
                            <option className="bg-zinc-900 text-white" value="EMPLOYEE">EMPLOYEE</option>
                            <option className="bg-zinc-900 text-white" value="MANAGER">MANAGER</option>
                            <option className="bg-zinc-900 text-white" value="ADMIN">ADMIN</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-right text-[9px] font-black uppercase text-zinc-600">
                           <select 
                            value={item.status} 
                            onChange={(e) => updateUser(item.id, item.role, e.target.value)}
                            disabled={user?.role !== "ADMIN"}
                            className={`bg-transparent border-b border-zinc-800 outline-none cursor-pointer disabled:cursor-not-allowed ${item.status === 'ACTIVE' ? 'text-green-500' : 'text-red-500'}`}
                          >
                            <option className="bg-zinc-900 text-white" value="ACTIVE">ACTIVE</option>
                            <option className="bg-zinc-900 text-white" value="INACTIVE">INACTIVE</option>
                          </select>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* MODAL HORARIO */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
            <div className="bg-zinc-950 border border-red-600/50 p-8 rounded-2xl w-full max-w-md shadow-2xl">
              <h3 className="text-2xl font-black text-white uppercase mb-6 italic tracking-tighter">Nuevo Horario</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full bg-zinc-900 border border-red-900/30 rounded-lg p-3 text-white focus:border-red-600 outline-none text-sm" required />
                <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full bg-zinc-900 border border-red-900/30 rounded-lg p-3 text-white focus:border-red-600 outline-none text-sm" required />
                <button type="submit" className="w-full py-3 bg-red-600 text-white font-black rounded-lg uppercase text-xs tracking-widest hover:bg-red-700 transition-all">Crear Registro</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full text-zinc-500 text-xs font-bold uppercase hover:text-white transition-all">Cerrar</button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* PANEL LATERAL DE TAREAS (CRUD ANIDADO) */}
      {selectedScheduleId && (
        <aside className="w-96 bg-zinc-950 border-l border-red-900/30 p-8 flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.5)] animate-in slide-in-from-right duration-300">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Detalles del Turno</h3>
            <button onClick={() => setSelectedScheduleId(null)} className="text-red-600 font-bold hover:scale-110 transition-all text-xl">✕</button>
          </div>

          <form onSubmit={handleAddTask} className="mb-8 space-y-4 bg-zinc-900/40 p-4 rounded-xl border border-red-900/10">
            <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-2">Añadir Tarea</h4>
            <input type="text" placeholder="¿Qué se debe hacer?" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} className="w-full bg-zinc-900 border border-red-900/20 rounded-lg p-3 text-sm text-white focus:border-red-600 outline-none transition-all" />
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={isCritical} onChange={(e) => setIsCritical(e.target.checked)} className="accent-red-600 w-4 h-4" />
              <span className="text-[10px] font-black text-red-500 uppercase tracking-widest group-hover:text-red-400 decoration-red-600/50">Tarea Crítica</span>
            </label>
            <button type="button" onClick={handleAddTask} className="w-full py-3 bg-red-600 text-white font-black rounded-lg uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/10">Guardar Tarea</button>
          </form>

          <div className="flex-1 overflow-auto space-y-3 pr-2 scrollbar-hide">
            {isTaskLoading ? <p className="text-center text-xs text-zinc-700 animate-pulse mt-10 tracking-[0.2em]">Cargando...</p> : tasks.map(task => (
              <div key={task.id} className={`p-4 border group transition-all overflow-hidden relative ${task.isCritical ? 'border-red-600/40 bg-red-600/5' : 'border-zinc-800 bg-zinc-900/30'} rounded-xl`}>
                <div className="flex justify-between items-start relative z-10">
                  <div className="flex items-start gap-3">
                    <input 
                      type="checkbox" 
                      checked={task.isCompleted} 
                      onChange={() => toggleTask(task.id, task.isCompleted)}
                      className="mt-1 accent-red-600 w-4 h-4 cursor-pointer"
                    />
                    <h4 className={`font-bold text-sm leading-tight ${task.isCompleted ? 'line-through text-zinc-600' : 'text-gray-100'}`}>{task.title}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {task.isCritical && <span className="text-[7px] bg-red-600 text-white px-1.5 py-0.5 font-black rounded shrink-0 italic tracking-tighter">CRITICAL</span>}
                    <button onClick={() => deleteTask(task.id)} className="text-zinc-600 hover:text-red-500 transition-colors" title="Eliminar tarea">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-end mt-4">
                  <p className="text-[8px] text-zinc-600 font-mono font-black uppercase">{new Date(task.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</p>
                  {task.isCompleted && <span className="text-[8px] text-green-500 font-black italic">✓ Completado</span>}
                </div>
                {task.isCritical && <div className="absolute top-0 right-0 w-12 h-12 bg-red-600/10 blur-xl rounded-full translate-x-1/2 -translate-y-1/2"></div>}
              </div>
            ))}
            {tasks.length === 0 && !isTaskLoading && (
              <div className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center">
                <p className="text-[10px] text-zinc-700 font-black uppercase tracking-[0.3em] font-mono">Sin Tareas</p>
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
