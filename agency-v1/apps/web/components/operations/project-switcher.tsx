"use client";

import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

export function ProjectSwitcher({ projects, activeId }: { projects: any[]; activeId: string }) {
  const router = useRouter();

  if (!projects || projects.length === 0) return null;

  return (
    <div className="relative inline-block mb-1 group">
      <select
        value={activeId}
        onChange={(e) => {
          const params = new URLSearchParams(window.location.search);
          params.set("projectId", e.target.value);
          router.push(`?${params.toString()}`);
        }}
        className="appearance-none bg-transparent text-2xl font-bold text-white pr-8 py-1 outline-none cursor-pointer hover:text-teal-400 transition-colors"
      >
        {projects.map(p => (
          <option key={p.id} value={p.id} className="text-sm bg-slate-900 text-white">
            {p.name}
          </option>
        ))}
      </select>
      <ChevronDown className="w-5 h-5 text-slate-500 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-teal-400 transition-colors" />
    </div>
  );
}
