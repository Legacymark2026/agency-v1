import React from "react";
import { Info, AlertCircle, Lightbulb, CheckCircle2 } from "lucide-react";

export interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

export function extractHeadings(content: string): HeadingItem[] {
  const headings: HeadingItem[] = [];
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("## ")) {
      const text = trimmed.replace(/^##\s+/, "");
      const id = text.toLowerCase().replace(/[^a-z0-9áéíóúñ]+/g, "-").replace(/^-+|-+$/g, "");
      headings.push({ id, text, level: 2 });
    } else if (trimmed.startsWith("### ")) {
      const text = trimmed.replace(/^###\s+/, "");
      const id = text.toLowerCase().replace(/[^a-z0-9áéíóúñ]+/g, "-").replace(/^-+|-+$/g, "");
      headings.push({ id, text, level: 3 });
    }
  }
  return headings;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function parseInlineFormatting(text: string): React.ReactNode {
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\))/g;
  const segments = text.split(regex);

  return segments.map((seg, idx) => {
    if (seg.startsWith("**") && seg.endsWith("**")) {
      const inner = seg.slice(2, -2).replace(/[<>]/g, "");
      return <strong key={idx} className="font-black text-slate-900">{inner}</strong>;
    }
    if (seg.startsWith("*") && seg.endsWith("*")) {
      const inner = seg.slice(1, -1).replace(/[<>]/g, "");
      return <em key={idx} className="italic text-slate-800">{inner}</em>;
    }
    if (seg.startsWith("`") && seg.endsWith("`")) {
      const inner = seg.slice(1, -1);
      return <code key={idx} className="px-1.5 py-0.5 rounded bg-slate-100 text-[#01426F] font-mono text-xs">{inner}</code>;
    }
    const linkMatch = seg.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      const rawUrl = linkMatch[2].trim();
      // Validar esquema seguro: solo permitir http, https, mailto o rutas relativas
      const isSafeUrl = /^(https?:\/\/|mailto:|\/)/i.test(rawUrl);
      const safeHref = isSafeUrl ? rawUrl : "#";
      const cleanLinkText = linkMatch[1].replace(/[<>]/g, "");

      return (
        <a 
          key={idx} 
          href={safeHref} 
          target={safeHref.startsWith("http") ? "_blank" : undefined}
          rel="noopener noreferrer" 
          className="text-[#B08A1A] font-semibold underline underline-offset-2 hover:text-amber-700 transition-colors"
        >
          {cleanLinkText}
        </a>
      );
    }
    // Sanitizar texto plano eliminando inyecciones directas
    return seg;
  });
}

export function ArticleContentRenderer({ content }: { content: string }) {
  const blocks = content.split("\n\n").filter((b) => b.trim());

  return (
    <div className="space-y-6 text-slate-700 text-base sm:text-lg leading-[1.8]">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();

        // Título H2
        if (trimmed.startsWith("## ")) {
          const text = trimmed.replace(/^##\s+/, "");
          const id = text.toLowerCase().replace(/[^a-z0-9áéíóúñ]+/g, "-").replace(/^-+|-+$/g, "");
          return (
            <h2 
              key={idx} 
              id={id} 
              className="text-2xl sm:text-3xl font-black text-slate-900 pt-6 pb-2 border-b border-slate-200 scroll-mt-24"
            >
              {text}
            </h2>
          );
        }

        // Título H3
        if (trimmed.startsWith("### ")) {
          const text = trimmed.replace(/^###\s+/, "");
          const id = text.toLowerCase().replace(/[^a-z0-9áéíóúñ]+/g, "-").replace(/^-+|-+$/g, "");
          return (
            <h3 
              key={idx} 
              id={id} 
              className="text-xl font-bold text-[#01426F] pt-4 scroll-mt-24"
            >
              {text}
            </h3>
          );
        }

        // Cita Directiva
        if (trimmed.startsWith('> "') || (trimmed.startsWith("> ") && !trimmed.startsWith("> [!"))) {
          const cleanQuote = trimmed.replace(/^>\s*/, "").replace(/^"/, "").replace(/"$/, "");
          return (
            <blockquote 
              key={idx} 
              className="p-6 my-4 rounded-2xl bg-amber-500/[0.07] border-l-4 border-[#B08A1A] text-slate-800 font-medium italic text-lg shadow-xs"
            >
              &ldquo;{cleanQuote}&rdquo;
            </blockquote>
          );
        }

        // Alertas Ejecutivas
        if (trimmed.includes("[!NOTE]")) {
          const noteText = trimmed.replace(/>\s*\[!NOTE\]\s*/g, "");
          return (
            <div key={idx} className="p-5 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-900 text-sm flex items-start gap-3 shadow-xs">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{parseInlineFormatting(noteText)}</div>
            </div>
          );
        }

        if (trimmed.includes("[!IMPORTANT]")) {
          const impText = trimmed.replace(/>\s*\[!IMPORTANT\]\s*/g, "");
          return (
            <div key={idx} className="p-5 rounded-2xl bg-rose-50/80 border border-rose-200 text-rose-900 text-sm flex items-start gap-3 shadow-xs">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{parseInlineFormatting(impText)}</div>
            </div>
          );
        }

        if (trimmed.includes("[!TIP]")) {
          const tipText = trimmed.replace(/>\s*\[!TIP\]\s*/g, "");
          return (
            <div key={idx} className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-sm flex items-start gap-3 shadow-xs">
              <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{parseInlineFormatting(tipText)}</div>
            </div>
          );
        }

        // Tabla Markdown
        if (trimmed.includes("|") && trimmed.includes("---")) {
          const lines = trimmed.split("\n").filter(l => l.includes("|"));
          const headers = lines[0]?.split("|").filter(c => c.trim()).map(c => c.trim());
          const rows = lines.slice(2).map(l => l.split("|").filter(c => c.trim()).map(c => c.trim()));

          return (
            <div key={idx} className="overflow-x-auto my-6 rounded-2xl border border-slate-200 shadow-xs">
              <table className="min-w-full text-sm text-left divide-y divide-slate-200">
                <thead className="bg-[#01426F] text-white">
                  <tr>
                    {headers?.map((h, hIdx) => (
                      <th key={hIdx} className="px-5 py-3.5 font-bold tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-5 py-3 text-slate-700 font-medium">
                          {parseInlineFormatting(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        // Lista con Viñetas
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const items = trimmed.split("\n").map(i => i.replace(/^[-*]\s+/, "").trim());
          return (
            <ul key={idx} className="space-y-2.5 my-4 pl-2">
              {items.map((it, itIdx) => (
                <li key={itIdx} className="flex items-start gap-3 text-slate-800 text-base">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                  <span>{parseInlineFormatting(it)}</span>
                </li>
              ))}
            </ul>
          );
        }

        // Lista Numerada
        if (/^\d+\.\s/.test(trimmed)) {
          const items = trimmed.split("\n").map(i => i.replace(/^\d+\.\s+/, "").trim());
          return (
            <ol key={idx} className="space-y-2.5 my-4 pl-2 list-none">
              {items.map((it, itIdx) => (
                <li key={itIdx} className="flex items-start gap-3 text-slate-800 text-base">
                  <span className="w-6 h-6 rounded-full bg-[#01426F] text-[#D4AF37] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {itIdx + 1}
                  </span>
                  <span>{parseInlineFormatting(it)}</span>
                </li>
              ))}
            </ol>
          );
        }

        // Párrafo estándar
        return (
          <p key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            {parseInlineFormatting(trimmed)}
          </p>
        );
      })}
    </div>
  );
}
