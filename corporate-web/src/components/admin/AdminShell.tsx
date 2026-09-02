"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  BarChart3, 
  FileText, 
  PlusCircle, 
  Globe, 
  LogOut, 
  ShieldCheck,
  Building2
} from "lucide-react";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Si está en la página de login, no mostrar la barra lateral
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth", { method: "DELETE" });
      router.push("/admin/login");
      router.refresh();
    } catch {
      router.push("/admin/login");
    }
  };

  const navItems = [
    { name: "Analítica en Vivo", href: "/admin", icon: BarChart3 },
    { name: "Artículos del Blog", href: "/admin/blog", icon: FileText },
    { name: "Nuevo Artículo", href: "/admin/blog/nuevo", icon: PlusCircle },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row text-slate-800">
      {/* Sidebar */}
      <aside className="w-full lg:w-72 bg-[#0B192C] text-white p-6 flex flex-col justify-between border-r border-amber-900/30 shrink-0">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 pb-6 border-b border-slate-800 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#1E3E62] border border-[#B08A1A] flex items-center justify-center text-[#D4AF37]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-black tracking-wider text-white block">
                NEO<span className="text-[#B08A1A]">GESTIÓN</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Panel de Control
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                    active
                      ? "bg-[#B08A1A] text-slate-950 shadow-md font-black"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Sidebar */}
        <div className="pt-6 border-t border-slate-800 space-y-3 mt-6 lg:mt-0">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Globe className="w-4 h-4 text-[#B08A1A]" />
            <span>Ver Sitio Web Público</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-950/60 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>

          <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Base de datos neogestion.db activa</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
