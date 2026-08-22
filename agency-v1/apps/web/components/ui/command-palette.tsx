"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DASHBOARD_DOMAINS_NAVIGATION } from "../../config/dashboard-navigation";

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!isOpen) return null;

  const allItems = DASHBOARD_DOMAINS_NAVIGATION.flatMap((cat) => cat.items);
  const filteredItems = allItems.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNavigate = (href: string) => {
    setIsOpen(false);
    setSearchQuery("");
    router.push(href);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-start justify-center pt-20 p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col space-y-4 p-4 animate-in fade-in zoom-in duration-150">
        {/* Search Input */}
        <div className="flex items-center border-b border-slate-800 pb-3 px-2">
          <span className="text-slate-400 text-lg mr-3">🔍</span>
          <input
            type="text"
            autoFocus
            placeholder="Buscar página, herramienta o comando (esc/click fuera para cerrar)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-slate-100 text-sm focus:outline-none placeholder-slate-500"
          />
          <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-1 rounded">ESC</span>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto space-y-1">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <div
                key={item.href}
                onClick={() => handleNavigate(item.href)}
                className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-800/80 cursor-pointer transition-all text-xs"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-semibold text-slate-200">{item.title}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-slate-500 font-mono">{item.serviceKey}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-slate-500 text-xs">
              No se encontraron comandos o páginas coincidentes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
