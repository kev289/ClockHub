import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-red-600 selection:text-white flex flex-col font-sans">
      {/* NAVEGACIÓN SUPERIOR */}
      <header className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full z-10 border-b border-red-900/20">
        <h1 className="text-3xl font-black tracking-tighter text-red-600 italic">ClockHub</h1>
        <nav className="flex space-x-6 items-center">
          <Link href="/login" className="text-sm font-bold text-gray-300 hover:text-white transition-colors">
            Iniciar Sesión
          </Link>
          <Link 
            href="/register" 
            className="text-xs font-black uppercase tracking-widest bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:scale-105"
          >
            Registrarse
          </Link>
        </nav>
      </header>

      {/* SECCIÓN HERO PRINCIPAL */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
        {/* Adornos Visuales de Fondo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[800px] h-[600px] md:h-[800px] bg-red-900/10 rounded-full blur-[100px] md:blur-[120px] pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-red-600/5 rounded-full blur-[60px] md:blur-[80px] pointer-events-none"></div>

        <div className="z-10 max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-tight drop-shadow-2xl">
            Control de <span className="text-transparent bg-clip-text bg-gradient-to-br from-red-400 to-red-800">Horarios</span> <br /> 
            Desatado.
          </h2>
          
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto font-medium leading-relaxed">
            Plataforma disenada para la gestion de horarios de trabajo.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link 
              href="/register" 
              className="w-full sm:w-auto px-8 py-4 bg-red-600 text-white font-black rounded-lg hover:bg-red-700 transition-all uppercase text-xs tracking-[0.2em] shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:shadow-[0_0_50px_rgba(220,38,38,0.6)] hover:-translate-y-1"
            >
              Comenzar Ahora
            </Link>
            <Link 
              href="/login" 
              className="w-full sm:w-auto px-8 py-4 bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold rounded-lg hover:bg-zinc-800 transition-all uppercase text-xs tracking-widest hover:border-red-900/50"
            >
              Ya tengo una cuenta
            </Link>
          </div>
        </div>
      </main>

      <footer className="text-center py-8 text-zinc-600 text-xs font-bold uppercase tracking-widest border-t border-red-900/20 bg-zinc-950 z-10 relative mt-auto">
        &copy; {new Date().getFullYear()} 
      </footer>
    </div>
  );
}
