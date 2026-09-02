"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  PlusCircle, 
  Search, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Eye, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  RefreshCw 
} from "lucide-react";

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  authorName: string;
  readTime: string;
  published: boolean;
  viewsCount: number;
  createdAt: string;
}

export default function AdminBlogPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchPosts = async () => {
      try {
        const url = search
          ? `/api/admin/posts?search=${encodeURIComponent(search)}`
          : "/api/admin/posts";
        const res = await fetch(url);
        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }
        const data = await res.json();
        if (isMounted) {
          setPosts(data.posts || []);
          setLoading(false);
        }
      } catch (e) {
        console.error(e);
        if (isMounted) setLoading(false);
      }
    };

    fetchPosts();
    return () => {
      isMounted = false;
    };
  }, [search, router, refreshIndex]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`¿Está seguro de eliminar el artículo "${title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/posts/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert("Error al eliminar");
      }
    } catch {
      alert("Error de conexión");
    }
  };

  const handleTogglePublish = async (post: Post) => {
    try {
      const res = await fetch(`/api/admin/posts/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...post,
          published: !post.published,
        }),
      });
      if (res.ok) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id ? { ...p, published: !p.published } : p
          )
        );
      }
    } catch {
      alert("Error al actualizar estado");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#B08A1A] block mb-1">
            Gestión de Contenidos
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Artículos del Magazine Corporativo
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Administre las publicaciones, controle el estado de publicación y analice la lectura real.
          </p>
        </div>

        <Link
          href="/admin/blog/nuevo"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#B08A1A] to-[#D4AF37] text-slate-950 font-black text-xs hover:brightness-110 transition-all shadow-md self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Crear Nuevo Artículo</span>
        </Link>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, categoría..."
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#B08A1A]"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            setLoading(true);
            setRefreshIndex((r) => r + 1);
          }}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#B08A1A]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#B08A1A]" : ""}`} />
          <span>Refrescar lista</span>
        </button>
      </div>

      {/* Tabla de Artículos */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider">
                <th className="py-4 px-6 font-bold">Artículo</th>
                <th className="py-4 px-4 font-bold">Categoría</th>
                <th className="py-4 px-4 font-bold">Autor</th>
                <th className="py-4 px-4 font-bold text-center">Estado</th>
                <th className="py-4 px-4 font-bold text-right">Vistas</th>
                <th className="py-4 px-6 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {posts.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No se encontraron artículos.
                  </td>
                </tr>
              ) : (
                posts.map((post) => {
                  const dateFormatted = new Date(post.createdAt).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  });
                  return (
                    <tr key={post.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-6 max-w-sm">
                        <span className="font-bold text-slate-900 block line-clamp-1 text-sm">
                          {post.title}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{dateFormatted}</span>
                          </span>
                          <span>•</span>
                          <span>{post.readTime}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-md bg-amber-50 border border-[#B08A1A]/30 text-[#B08A1A] font-bold text-[11px]">
                          {post.category}
                        </span>
                      </td>

                      <td className="py-4 px-4 font-medium text-slate-700">
                        {post.authorName}
                      </td>

                      <td className="py-4 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(post)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                            post.published
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                          }`}
                          title="Hacer clic para cambiar estado"
                        >
                          {post.published ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Publicado</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              <span>Borrador</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <span className="inline-flex items-center gap-1 font-black text-slate-900 text-sm">
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          <span>{post.viewsCount}</span>
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            className="p-2 text-slate-400 hover:text-[#B08A1A] rounded-lg hover:bg-slate-100 transition-colors"
                            title="Ver en la web"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>

                          <Link
                            href={`/admin/blog/${post.id}/editar`}
                            className="p-2 text-slate-600 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Editar artículo"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleDelete(post.id, post.title)}
                            className="p-2 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Eliminar artículo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
