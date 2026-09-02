"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

export default function AdminNewPostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    category: "Estrategia",
    authorName: "Carlos Mendoza R.",
    authorRole: "Socio Director General",
    imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
    readTime: "6 min de lectura",
    excerpt: "",
    content: "",
    published: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al crear el artículo");
        setLoading(false);
        return;
      }

      router.push("/admin/blog");
      router.refresh();
    } catch {
      setError("Error de comunicación con el servidor");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Volver */}
      <Link
        href="/admin/blog"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#B08A1A] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a Lista de Artículos</span>
      </Link>

      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-[#B08A1A] block mb-1">
          Editor Editorial
        </span>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Redactar Nuevo Artículo del Magazine
        </h1>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        {/* Título */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Título Principal del Artículo *
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ej. Claves para la Gobernanza de IA en Comités Directivos"
            className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#B08A1A]"
          />
        </div>

        {/* Categoría y Tiempo de Lectura */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Categoría
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#B08A1A]"
            >
              <option value="Estrategia">Estrategia</option>
              <option value="Tecnología">Tecnología</option>
              <option value="Ciberseguridad">Ciberseguridad</option>
              <option value="Gestión">Gestión</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Tiempo Estimado de Lectura
            </label>
            <input
              type="text"
              required
              value={formData.readTime}
              onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
              placeholder="Ej. 6 min de lectura"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#B08A1A]"
            />
          </div>
        </div>

        {/* Autor y Rol */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Nombre del Autor
            </label>
            <input
              type="text"
              required
              value={formData.authorName}
              onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#B08A1A]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Cargo o Rol del Autor
            </label>
            <input
              type="text"
              required
              value={formData.authorRole}
              onChange={(e) => setFormData({ ...formData, authorRole: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#B08A1A]"
            />
          </div>
        </div>

        {/* Imagen de Portada */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            URL de Imagen de Portada
          </label>
          <input
            type="url"
            required
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#B08A1A]"
          />
        </div>

        {/* Resumen / Excerpt */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Resumen Ejecutivo (Aparece en feeds y tarjetas) *
          </label>
          <textarea
            required
            rows={3}
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            placeholder="Breve síntesis de la tesis o hallazgo del artículo..."
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#B08A1A]"
          />
        </div>

        {/* Contenido Completo */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Contenido Completo (Separa los párrafos con un salto de línea doble) *
          </label>
          <textarea
            required
            rows={10}
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Escriba el desarrollo del artículo, argumentos, viñetas y conclusiones..."
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs leading-relaxed text-slate-900 focus:outline-none focus:border-[#B08A1A] font-sans"
          />
        </div>

        {/* Publicado Toggle */}
        <div className="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            id="published"
            checked={formData.published}
            onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
            className="w-4 h-4 text-[#B08A1A] rounded border-slate-300 focus:ring-[#B08A1A]"
          />
          <label htmlFor="published" className="text-xs font-bold text-slate-800">
            Publicar inmediatamente en el Magazine visible para visitantes
          </label>
        </div>

        {/* Submit */}
        <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
          <Link
            href="/admin/blog"
            className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
          >
            Cancelar
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#B08A1A] to-[#D4AF37] text-slate-950 font-black text-xs hover:brightness-110 transition-all shadow-md disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar y Publicar Artículo</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
