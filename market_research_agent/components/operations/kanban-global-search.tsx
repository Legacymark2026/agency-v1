"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, FileText, MessageSquare, CheckSquare, Loader2, ArrowRight } from "lucide-react";
import { globalKanbanSearch } from "@/actions/kanban-search";

interface GlobalSearchProps {
  projectId?: string;
  onSelectTask: (taskId: string) => void;
  onClose: () => void;
}

const TYPE_ICONS = {
  task: FileText,
  comment: MessageSquare,
  subtask: CheckSquare,
};

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "#f87171", HIGH: "#fbbf24", MEDIUM: "#60a5fa", LOW: "#94a3b8",
};

export function KanbanGlobalSearch({ projectId, onSelectTask, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    const res = await globalKanbanSearch(q, projectId);
    if (res.success) setResults(res.results);
    setLoading(false);
    setSelected(0);
  }, [projectId]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === "Enter" && results[selected]) { onSelectTask(results[selected].taskId); onClose(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [results, selected, onSelectTask, onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
          {loading ? <Loader2 className="w-4 h-4 text-teal-400 animate-spin flex-shrink-0" /> : <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />}
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar tareas, comentarios, subtareas..."
            className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-sm"
          />
          {query && <button onClick={() => { setQuery(""); setResults([]); }} className="text-slate-500 hover:text-slate-300"><X className="w-4 h-4" /></button>}
          <kbd className="text-[10px] text-slate-600 border border-slate-700 rounded px-1.5 py-0.5">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {results.length === 0 && query.length >= 2 && !loading && (
            <div className="px-4 py-6 text-center text-slate-600 text-sm">Sin resultados para "{query}"</div>
          )}
          {query.length < 2 && (
            <div className="px-4 py-6 text-center text-slate-600 text-sm">
              Escribe al menos 2 caracteres para buscar · <span className="text-slate-500">↑↓ para navegar · Enter para abrir</span>
            </div>
          )}
          {results.map((r, i) => {
            const Icon = TYPE_ICONS[r.type as keyof typeof TYPE_ICONS] || FileText;
            const isSelected = i === selected;
            return (
              <button
                key={`${r.taskId}-${i}`}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${isSelected ? "bg-teal-500/10" : "hover:bg-slate-800/60"}`}
                onClick={() => { onSelectTask(r.taskId); onClose(); }}
                onMouseEnter={() => setSelected(i)}
              >
                <Icon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{r.title}</p>
                  <p className="text-[10px] text-slate-500 truncate">{r.subtitle}</p>
                </div>
                {r.priority && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0" style={{ color: PRIORITY_COLORS[r.priority], background: `${PRIORITY_COLORS[r.priority]}20` }}>
                    {r.priority}
                  </span>
                )}
                {isSelected && <ArrowRight className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-800 flex items-center gap-4 text-[10px] text-slate-600">
          <span><kbd className="border border-slate-700 rounded px-1">↑↓</kbd> navegar</span>
          <span><kbd className="border border-slate-700 rounded px-1">Enter</kbd> abrir</span>
          <span><kbd className="border border-slate-700 rounded px-1">Esc</kbd> cerrar</span>
        </div>
      </div>
    </div>
  );
}
