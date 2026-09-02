"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Calendar, Clock, ArrowRight, User, Tag } from "lucide-react";
import { blogPosts, blogCategories, BlogPost } from "@/data/blogData";

export default function BlogFeed() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");

  const filteredPosts = blogPosts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "Todas" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      {/* Controles: Buscador Expandible y Píldoras de Categoría con Fondo Dorado Activo */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm mb-12">
        <div className="flex flex-col lg:flex-row gap-6 justify-between items-center">
          {/* Buscador */}
          <div className="relative w-full lg:w-96 group">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-[#B08A1A] transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por término, temática o autor..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#B08A1A] focus:bg-white transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-3.5 text-xs text-slate-400 hover:text-slate-600 font-semibold"
              >
                Borrar
              </button>
            )}
          </div>

          {/* Menú de Píldoras de Categoría (Pill activa con fondo Dorado #B08A1A) */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {blogCategories.map((category) => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                    active
                      ? "bg-[#B08A1A] text-slate-950 shadow-md scale-105"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid de Artículos Tipo Masonry con Overlays Azules y Zoom Hover */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
          <p className="text-slate-500 text-base mb-4">
            No encontramos publicaciones que coincidan con su búsqueda.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("Todas");
            }}
            className="px-5 py-2.5 bg-[#0B192C] text-[#D4AF37] text-xs font-bold rounded-xl hover:bg-slate-900"
          >
            Restablecer Filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredPosts.map((post: BlogPost, index) => {
            const isTall = index % 2 === 0;
            return (
              <article
                key={post.slug}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-2xl hover:border-[#B08A1A] transition-all duration-300 flex flex-col group"
              >
                {/* Imagen Destacada con Overlay Azul y Zoom en Hover */}
                <div className={`overflow-hidden relative ${isTall ? "h-64" : "h-56"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  />
                  {/* Overlay Azul con oscurecimiento en hover */}
                  <div className="absolute inset-0 bg-[#0B192C]/40 group-hover:bg-[#0B192C]/75 transition-colors duration-300 flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#B08A1A] to-[#D4AF37] text-slate-950 text-xs font-black shadow-lg">
                      Leer artículo completo
                    </span>
                  </div>

                  {/* Badge de Categoría */}
                  <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0B192C]/85 backdrop-blur-md text-[#D4AF37] border border-[#B08A1A]/40 text-xs font-bold">
                      <Tag className="w-3 h-3 text-[#B08A1A]" />
                      <span>{post.category}</span>
                    </span>
                  </div>
                </div>

                <div className="p-8 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#B08A1A]" />
                        <span>{post.date}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{post.readTime}</span>
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-slate-900 mb-3 group-hover:text-[#B08A1A] transition-colors leading-snug">
                      <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                    </h3>

                    <p className="text-slate-600 text-sm leading-relaxed mb-6 line-clamp-3">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#0B192C] text-[#D4AF37] flex items-center justify-center font-bold text-xs">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{post.author.name}</h4>
                        <p className="text-[11px] text-slate-400">{post.author.role}</p>
                      </div>
                    </div>

                    <Link
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#B08A1A] group-hover:text-[#8C6B12]"
                    >
                      <span>Leer post</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
