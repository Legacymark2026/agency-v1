import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock, User, Tag, Share2, ArrowRight, ListTree } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post) return { title: "Artículo no encontrado" };

  return {
    title: `${post.title} | NEOGESTIÓN Magazine`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;

  // Buscar artículo y sumar 1 a viewsCount
  const post = await prisma.post.findUnique({
    where: { slug },
  });

  if (!post || !post.published) {
    notFound();
  }

  // Incrementar contador de lecturas de forma atómica
  await prisma.post.update({
    where: { id: post.id },
    data: { viewsCount: { increment: 1 } },
  }).catch(() => {});

  // Artículos relacionados
  const relatedPosts = await prisma.post.findMany({
    where: {
      published: true,
      id: { not: post.id },
    },
    take: 2,
    orderBy: { viewsCount: "desc" },
  });

  const dateFormatted = new Date(post.createdAt).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const paragraphs = post.content.split("\n\n").filter((p) => p.trim());

  return (
    <article className="min-h-screen bg-slate-50 py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Volver */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-[#B08A1A] mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Magazine</span>
        </Link>

        {/* Cabecera del Artículo */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-[#B08A1A] border border-[#B08A1A]/30 text-xs font-bold">
              <Tag className="w-3 h-3 text-[#B08A1A]" />
              <span>{post.category}</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-[#B08A1A]" />
              <span>{dateFormatted}</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              <span>{post.readTime}</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-400 font-semibold">
              {post.viewsCount + 1} lecturas
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-6">
            {post.title}
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 leading-relaxed mb-8 font-medium">
            {post.excerpt}
          </p>

          {/* Autor */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#0B192C] text-[#D4AF37] border border-[#B08A1A]/50 flex items-center justify-center font-bold text-sm">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{post.authorName}</h3>
                <p className="text-xs text-[#B08A1A] font-semibold">{post.authorRole}</p>
              </div>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-[#B08A1A]" />
              <span className="hidden sm:inline">Análisis Directivo NEOGESTIÓN</span>
            </div>
          </div>
        </div>

        {/* Imagen Portada */}
        <div className="rounded-3xl overflow-hidden mb-12 shadow-xl border border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full h-80 sm:h-[420px] object-cover"
          />
        </div>

        {/* Layout de Contenido: Índice Lateral Sticky + Columna de Lectura 700px */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Índice Pegajoso */}
          <aside className="lg:col-span-4 sticky top-28 hidden lg:block">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <ListTree className="w-4 h-4 text-[#B08A1A]" />
                <span>Estructura del Artículo</span>
              </h3>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="font-semibold text-[#B08A1A] hover:underline cursor-pointer">
                  1. Contexto &amp; Diagnóstico Inicial
                </li>
                <li className="hover:text-slate-900 cursor-pointer">
                  2. Principios y Pilares de Aplicación
                </li>
                <li className="hover:text-slate-900 cursor-pointer">
                  3. Recomendaciones para el C-Level
                </li>
                <li className="hover:text-slate-900 cursor-pointer">
                  4. Conclusiones y Próximos Pasos
                </li>
              </ul>

              <div className="pt-4 border-t border-slate-100">
                <span className="text-[11px] text-slate-400 block mb-2">
                  ¿Desea asesoría sobre este tema?
                </span>
                <Link
                  href="/contacto"
                  className="w-full block text-center px-4 py-2.5 rounded-xl bg-[#0B192C] text-[#D4AF37] text-xs font-bold hover:bg-slate-900 transition-colors"
                >
                  Contactar al Autor
                </Link>
              </div>
            </div>
          </aside>

          {/* Cuerpo del Artículo */}
          <div className="lg:col-span-8 max-w-[700px] space-y-6 text-slate-700 text-base sm:text-lg leading-[1.8]">
            {paragraphs.map((paragraph, idx) => (
              <p key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                {paragraph}
              </p>
            ))}

            {/* Banner de Consulta Especializada */}
            <div className="mt-12 p-8 sm:p-10 rounded-3xl bg-[#0B192C] text-white border border-[#B08A1A]">
              <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] block mb-2">
                Asesoría a la Medida
              </span>
              <h3 className="text-2xl font-black mb-2">
                ¿Cómo aplicar estos principios en su empresa?
              </h3>
              <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                Nuestros directores y especialistas pueden realizar una sesión de aplicabilidad confidencial para la estructura de su organización.
              </p>
              <Link
                href="/contacto"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#B08A1A] to-[#D4AF37] text-slate-950 font-bold text-xs hover:brightness-110 transition-all shadow-md"
              >
                <span>Agendar Sesión de Trabajo</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Artículos Relacionados */}
            {relatedPosts.length > 0 && (
              <div className="mt-16 pt-8 border-t border-slate-200">
                <h3 className="text-xl font-bold text-slate-900 mb-6">
                  Artículos Relacionados del Magazine
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {relatedPosts.map((rel) => (
                    <Link
                      key={rel.slug}
                      href={`/blog/${rel.slug}`}
                      className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#B08A1A] transition-colors block group"
                    >
                      <span className="text-[10px] font-bold uppercase text-[#B08A1A] block mb-1">
                        {rel.category}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#B08A1A] transition-colors line-clamp-2">
                        {rel.title}
                      </h4>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
