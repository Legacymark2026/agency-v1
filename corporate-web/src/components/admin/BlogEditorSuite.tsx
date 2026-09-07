"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Bold, 
  Italic, 
  Heading2, 
  Heading3, 
  Quote, 
  List, 
  ListOrdered, 
  Link as LinkIcon, 
  Table, 
  Minus, 
  Sparkles, 
  Info, 
  AlertCircle, 
  Lightbulb, 
  Eye, 
  Edit3, 
  Columns, 
  Clock, 
  FileText, 
  Image as ImageIcon, 
  Search, 
  CheckCircle2, 
  Globe, 
  Wand2, 
  RotateCcw
} from "lucide-react";

export interface BlogPostFormData {
  title: string;
  slug?: string;
  category: string;
  authorName: string;
  authorRole: string;
  imageUrl: string;
  readTime: string;
  excerpt: string;
  content: string;
  published: boolean;
}

interface BlogEditorSuiteProps {
  initialData?: Partial<BlogPostFormData>;
  isEditing?: boolean;
  onSubmit: (data: BlogPostFormData) => Promise<void>;
  loading: boolean;
  error?: string;
  backHref?: string;
}

const categoryOptions = [
  "Estrategia",
  "Tecnología",
  "Ciberseguridad",
  "Gestión",
  "Sistemas ISO",
  "SG-SST & HSEQ",
  "Cero Papel",
  "Auditorías",
  "Talento Humano",
];

const unsplashPresets = [
  {
    name: "Oficina & Juntas Directivas",
    url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
    tag: "Corporativo"
  },
  {
    name: "Auditoría & Calidad",
    url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
    tag: "ISO & Normas"
  },
  {
    name: "Ingeniería & SG-SST",
    url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80",
    tag: "Seguridad Industrial"
  },
  {
    name: "Cero Papel & Cloud",
    url: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80",
    tag: "Tecnología"
  },
  {
    name: "Sostenibilidad & HSEQ",
    url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
    tag: "Gestión Ambiental"
  },
  {
    name: "Talento & Liderazgo",
    url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
    tag: "Personas"
  },
];

const editorialTemplates = [
  {
    name: "Análisis Normativo (ISO / SG-SST)",
    description: "Estructura para desglosar requisitos legales, riesgos de auditoría y plan de acción.",
    content: `## 1. Contexto & Diagnóstico Regulatorio

En el actual entorno empresarial colombiano y regional, el cumplimiento de las normativas vigentes ha dejado de ser un simple trámite administrativo para convertirse en un pilar de gobernanza y sostenibilidad directiva.

> "Las organizaciones que automatizan sus matrices legales reducen en un 70% el tiempo dedicado a la preparación de auditorías de entes certificadores."

## 2. Puntos Críticos en Auditorías Externas

Al evaluar los hallazgos más comunes de organismos como ICONTEC, SGS y entes del Ministerio del Trabajo, destacan tres aspectos recurrentes:

- **Falta de Trazabilidad Documental**: Documentos obsoletos o firmas sin validez legal.
- **Evidencias Desarticuladas**: Registros físicos dispersos que dificultan la verificación inmediata.
- **Planes de Acción Inconclusos**: Acciones correctivas (CAPA) sin medición formal de eficacia.

> [!IMPORTANT]
> El Decreto 1072 de 2015 y la Resolución 0312 de 2019 exigen que las evidencias del SG-SST estén bajo custodia segura y disponibles en línea para los comités paritarios y autoridades laborales.

## 3. Matriz Comparativa de Cumplimiento

| Aspecto Evaluado | Método Tradicional (Físico) | Modelo Sistematizado NeoGestión |
|---|---|---|
| Control Documental | Archivadores y firmas manuales | Cero Papel con firma electrónica |
| Trazabilidad de Riesgos | Hojas de cálculo desactualizadas | Matriz interactiva en tiempo real |
| Preparación de Auditoría | 3 a 5 semanas de trabajo manual | Generación de reportes en 1 clic |

## 4. Recomendaciones para el Comité de Gerencia

1. **Centralizar la Información**: Unifique los sistemas de gestión en una plataforma única con usuarios ilimitados.
2. **Empoderar a los Líderes de Proceso**: Descentralice la radicación y el reporte de no conformidades para que la mejora sea continua.
3. **Auditar Preventivamente**: Realice simulacros de auditoría semestrales utilizando cronogramas en línea.

## Conclusiones & Próximos Pasos

La sistematización no solo garantiza un 100% de conformidad ante las auditorías, sino que libera tiempo estratégico para que los equipos directivos se enfoquen en la innovación y el crecimiento de la empresa.`
  },
  {
    name: "Caso de Estudio Empresarial",
    description: "Estructura para documentar una transformación operativa exitosa y sus métricas.",
    content: `## El Reto Institucional

Antes de la modernización de sus procesos, la organización enfrentaba costos crecientes en suministros de papelería física, demoras de hasta 15 días en la aprobación de actas y comités, y dificultades para presentar evidencias consolidadas durante auditorías de certificación.

> "El principal cuello de botella no era la falta de talento humano, sino la fragmentación de la información en carpetas físicas y correos electrónicos aislados."

## La Estrategia Implementada con NeoGestión

A través de la consultoría estratégica y el despliegue del ecosistema modular, se ejecutó un plan de transformación en tres etapas:

1. **Virtualización Cero Papel**: Migración total de formatos, manuales y registros a la nube con perfiles de acceso seguros.
2. **Parametrización de Procesos**: Mapeo de flujos operativos con responsables y alertas automáticas de vencimiento.
3. **Despliegue sin Restricción de Usuarios**: Integración de todo el personal operativo y administrativo sin cobro de licencias adicionales.

> [!TIP]
> Al no existir costos de licenciamiento por usuario, el 100% de la nómina pudo acceder a sus evaluaciones de desempeño y capacitaciones sin generar sobrecostos tecnológicos.

## Resultados Cuantitativos Obtenidos

| Métrica Directiva | Estado Inicial | Resultado Alcanzado |
|---|---|---|
| Gasto Anual en Papelería | Alto costo recurrente | -80% Reducción verificada |
| Tiempo de Aprobación Documental | 12 a 15 días | Menos de 24 horas |
| Calificación en Auditoría | Observaciones abiertas | 99.4% Aprobación sin hallazgos |

## Lecciones Aprendidas para la Industria

La clave del éxito radicó en acompañar el software con la metodología probada de Consultoría de Colombia, asegurando que cada líder de proceso adoptara la herramienta con sentido de pertenencia y visión estratégica.`
  },
  {
    name: "Artículo de Opinión & Estrategia",
    description: "Estructura ejecutiva para posicionamiento de opinión, tesis directivas y visión de futuro.",
    content: `## La Tesis Central

En la era de la inteligencia artificial y la transformación digital acelerada, la verdadera ventaja competitiva de las empresas no radica en acumular software aislado, sino en lograr que sus procesos, personas y sistemas conversen en un solo ecosistema ágil y gobernable.

> "Un sistema de gestión que solo existe para cumplir una auditoría anual es un costo; un sistema que optimiza las decisiones de cada día es una ventaja competitiva."

## Las Tres Fuerzas que Están Redefiniendo la Operación

Analizando los comités directivos de más de 480 organizaciones, identificamos tres tendencias irreversibles:

- **Gobernanza Cero Papel**: La documentación física representa un riesgo de seguridad de la información y un freno para la velocidad comercial.
- **Gestión por Competencias Reales**: La medición del desempeño debe vincularse directamente con los planes de capacitación periódicos.
- **Modelos de Costo Predecible**: Las empresas rechazan cada vez más pagar tarifas mensuales por cada colaborador que ingresa a la nómina.

> [!NOTE]
> La flexibilidad operativa es hoy el principal indicador de resiliencia empresarial ante fluctuaciones macroeconómicas.

## Ruta de Acción para Juntas Directivas

Para liderar esta transición, los equipos ejecutivos deben priorizar:

1. **Diagnóstico de Madurez Normativa**: Evaluar la brecha entre los procesos documentados y la realidad diaria del personal.
2. **Eliminación de Islas de Información**: Conectar compras, comercial, HSEQ y dirección general en una sola base de datos confiable.
3. **Cultura de Autocontrol**: Formar a los colaboradores para que la calidad sea un hábito intrínseco y no una imposición externa.`
  }
];

export default function BlogEditorSuite({
  initialData,
  isEditing = false,
  onSubmit,
  loading,
  error,
  backHref = "/admin/blog"
}: BlogEditorSuiteProps) {
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [activeView, setActiveView] = useState<"write" | "preview" | "split">("write");

  const [formData, setFormData] = useState<BlogPostFormData>({
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    category: initialData?.category || "Estrategia",
    authorName: initialData?.authorName || "Carlos Mendoza R.",
    authorRole: initialData?.authorRole || "Socio Director General",
    imageUrl: initialData?.imageUrl || unsplashPresets[0].url,
    readTime: initialData?.readTime || "6 min de lectura",
    excerpt: initialData?.excerpt || "",
    content: initialData?.content || "",
    published: initialData?.published ?? true,
  });

  // Estadísticas del texto en vivo
  const wordsCount = formData.content.trim() ? formData.content.trim().split(/\s+/).length : 0;
  const charsCount = formData.content.length;
  const estimatedMins = Math.max(1, Math.ceil(wordsCount / 200));

  // Auto calcular tiempo de lectura
  const handleAutoCalcReadTime = () => {
    const calculated = `${estimatedMins} min de lectura`;
    setFormData((prev) => ({ ...prev, readTime: calculated }));
  };

  // Auto generar slug limpio
  const handleGenerateSlug = () => {
    const slug = formData.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    setFormData((prev) => ({ ...prev, slug }));
  };

  // Insertar Markdown en el cursor
  const insertMarkdown = (prefix: string, suffix: string = "", defaultText: string = "") => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;

    const selectedText = currentText.substring(start, end) || defaultText;
    const replacement = `${prefix}${selectedText}${suffix}`;

    const updated = currentText.substring(0, start) + replacement + currentText.substring(end);
    setFormData((prev) => ({ ...prev, content: updated }));

    // Reposicionar cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 50);
  };

  const handleApplyTemplate = (templateContent: string) => {
    if (formData.content.trim().length > 20) {
      const confirmReplace = window.confirm(
        "¿Desea reemplazar el contenido actual con la plantilla seleccionada?"
      );
      if (!confirmReplace) return;
    }
    setFormData((prev) => ({ ...prev, content: templateContent }));
    handleAutoCalcReadTime();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Barra Superior con Navegación y Estados */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#B08A1A] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Lista de Artículos</span>
        </Link>

        {/* Selector de Vistas: Redactar / Vista Previa / Dividida */}
        <div className="inline-flex items-center p-1 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveView("write")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeView === "write"
                ? "bg-[#01426F] text-[#D4AF37]"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Redactar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView("preview")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeView === "preview"
                ? "bg-[#01426F] text-[#D4AF37]"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Vista Previa</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView("split")}
            className={`hidden md:flex px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors items-center gap-1.5 ${
              activeView === "split"
                ? "bg-[#01426F] text-[#D4AF37]"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Doble Pantalla</span>
          </button>
        </div>
      </div>

      {/* Título de la Página de Edición */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-[#B08A1A]/30 text-[#B08A1A] text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5 text-[#B08A1A]" />
          <span>Suite Editorial de Alta Dirección</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          {isEditing ? "Editar Artículo del Magazine" : "Redactar Nuevo Artículo del Magazine"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Escriba y estructure publicaciones con formato enriquecido, citas directivas, tablas normativas y previsualización en tiempo real.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* BLOQUE 1: METADATOS PRINCIPALES (Título, Slug, Categoría, Tiempo) */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#B08A1A]" />
              <span>Información General &amp; Cabecera</span>
            </span>
            <span className="text-[11px] text-slate-400">Campos requeridos con *</span>
          </div>

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
              placeholder="Ej. Claves para la Gobernanza y Auditoría de Sistemas de Gestión en 2026"
              className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-base font-bold text-slate-900 focus:outline-none focus:border-[#B08A1A] focus:bg-white transition-all"
            />
          </div>

          {/* Slug URL amigable */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-9">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Identificador URL (Slug Amigable)
              </label>
              <div className="flex items-center rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-500 font-mono">
                <span className="shrink-0 text-slate-400">/blog/</span>
                <input
                  type="text"
                  value={formData.slug || ""}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="ej-claves-gobernanza-sistemas-gestion"
                  className="w-full bg-transparent text-slate-900 font-bold focus:outline-none ml-1 font-mono text-xs"
                />
              </div>
            </div>
            <div className="sm:col-span-3">
              <button
                type="button"
                onClick={handleGenerateSlug}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <Wand2 className="w-3.5 h-3.5 text-[#B08A1A]" />
                <span>Generar Slug</span>
              </button>
            </div>
          </div>

          {/* Categoría & Tiempo de Lectura */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Categoría Temática
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#B08A1A] focus:bg-white"
              >
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Tiempo Estimado de Lectura
                </label>
                <button
                  type="button"
                  onClick={handleAutoCalcReadTime}
                  className="text-[10px] text-[#B08A1A] hover:underline font-bold"
                >
                  Auto-calcular ({estimatedMins} min)
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.readTime}
                  onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                  placeholder="Ej. 6 min de lectura"
                  className="w-full px-4 py-3 pl-9 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-semibold focus:outline-none focus:border-[#B08A1A] focus:bg-white"
                />
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>
          </div>

          {/* Autor & Rol Directivo */}
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
                placeholder="Ej. Carlos Mendoza R."
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-semibold focus:outline-none focus:border-[#B08A1A] focus:bg-white"
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
                placeholder="Ej. Socio Director General • Auditor Líder"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-semibold focus:outline-none focus:border-[#B08A1A] focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* BLOQUE 2: IMAGEN DE PORTADA CON GALERÍA CURADA DE FONDOS */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-[#B08A1A]" />
              <span>Imagen de Portada en Alta Definición</span>
            </span>
            <span className="text-[11px] text-slate-400">Resolución recomendada: 1200x600 o superior</span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              URL de Imagen de Portada
            </label>
            <input
              type="url"
              required
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono focus:outline-none focus:border-[#B08A1A] focus:bg-white"
            />
          </div>

          {/* Galería de imágenes directivas curadas */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Galería Corporativa Recomendada (Seleccione con 1 clic):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {unsplashPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, imageUrl: preset.url }))}
                  className={`group text-left p-1.5 rounded-xl border transition-all ${
                    formData.imageUrl === preset.url
                      ? "border-[#B08A1A] bg-amber-500/10 shadow-sm scale-105"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="h-14 w-full rounded-lg overflow-hidden bg-slate-100 mb-1.5 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="text-[10px] font-bold text-slate-800 truncate">
                    {preset.name}
                  </div>
                  <div className="text-[9px] text-[#B08A1A] truncate">
                    {preset.tag}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Previsualización en Vivo de la Portada */}
          {formData.imageUrl && (
            <div className="mt-2 rounded-2xl overflow-hidden border border-slate-200 h-44 sm:h-52 bg-slate-900 relative shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={formData.imageUrl}
                alt="Vista previa portada"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-black/40 px-2 py-0.5 rounded-full border border-amber-400/30">
                    {formData.category}
                  </span>
                  <h4 className="text-white font-bold text-sm sm:text-base mt-1 line-clamp-1">
                    {formData.title || "Título del Artículo en Portada"}
                  </h4>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BLOQUE 3: RESUMEN EJECUTIVO (EXCERPT) & INSPECTOR SEO */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-[#B08A1A]" />
              <span>Resumen Ejecutivo &amp; Simulación Google SEO</span>
            </span>
            <span className="text-[11px] text-slate-400">
              {formData.excerpt.length} / 250 caracteres recomendados
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Resumen Ejecutivo (Aparece en feeds, tarjetas y meta-descripción) *
            </label>
            <textarea
              required
              rows={3}
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              placeholder="Síntesis directiva del artículo: exponga el hallazgo principal, el impacto operativo y la recomendación estratégica..."
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 leading-relaxed focus:outline-none focus:border-[#B08A1A] focus:bg-white"
            />
          </div>

          {/* Simulador Google SERP */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
              <Search className="w-3 h-3 text-[#B08A1A]" />
              <span>Previsualización en Resultados de Búsqueda (Google)</span>
            </span>
            <div className="text-xs text-emerald-700 truncate font-mono">
              https://neogestion.software/blog/{formData.slug || "titulo-del-articulo"}
            </div>
            <div className="text-sm font-bold text-blue-700 hover:underline cursor-pointer line-clamp-1">
              {formData.title || "Título del Artículo | NEOGESTIÓN Magazine"}
            </div>
            <div className="text-xs text-slate-600 line-clamp-2">
              {formData.excerpt || "Este es un ejemplo de cómo los usuarios y tomadores de decisiones visualizarán su artículo en los motores de búsqueda..."}
            </div>
          </div>
        </div>

        {/* BLOQUE 4: EDITOR DE CONTENIDO COMPLETO CON BARRA DE HERRAMIENTAS & PLANTILLAS */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-[#B08A1A]" />
                <span>Desarrollo del Artículo (Markdown Enriquecido) *</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Formato estructurado para comités de gerencia y líderes de calidad.
              </span>
            </div>

            {/* Asistente de Plantillas */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">Plantillas:</span>
              <div className="flex flex-wrap gap-1.5">
                {editorialTemplates.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyTemplate(tmpl.content)}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-[#B08A1A] text-[11px] font-bold border border-[#B08A1A]/30 transition-colors"
                    title={tmpl.description}
                  >
                    + {tmpl.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* BARRA DE HERRAMIENTAS DE FORMATO (TOOLBAR) */}
          <div className="flex flex-wrap items-center gap-1 p-2 rounded-2xl bg-slate-100 border border-slate-200">
            {/* Títulos */}
            <button
              type="button"
              onClick={() => insertMarkdown("\n\n## ", "\n", "Título de la Sección")}
              className="p-2 rounded-lg bg-white hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 shadow-sm transition-colors"
              title="Título H2 (Sección Principal)"
            >
              <Heading2 className="w-4 h-4 text-[#01426F]" />
              <span className="hidden sm:inline">H2</span>
            </button>

            <button
              type="button"
              onClick={() => insertMarkdown("\n\n### ", "\n", "Subtítulo de Detalle")}
              className="p-2 rounded-lg bg-white hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 shadow-sm transition-colors"
              title="Subtítulo H3"
            >
              <Heading3 className="w-4 h-4 text-[#01426F]" />
              <span className="hidden sm:inline">H3</span>
            </button>

            <div className="w-px h-5 bg-slate-300 mx-1" />

            {/* Estilos */}
            <button
              type="button"
              onClick={() => insertMarkdown("**", "**", "texto en negrita")}
              className="p-2 rounded-lg bg-white hover:bg-slate-200 text-slate-700 shadow-sm transition-colors"
              title="Negrita (**texto**)"
            >
              <Bold className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => insertMarkdown("*", "*", "texto en cursiva")}
              className="p-2 rounded-lg bg-white hover:bg-slate-200 text-slate-700 shadow-sm transition-colors"
              title="Cursiva (*texto*)"
            >
              <Italic className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-slate-300 mx-1" />

            {/* Listas & Citas */}
            <button
              type="button"
              onClick={() => insertMarkdown('\n\n> "', '"\n', "Cita directiva o reflexión de alta dirección")}
              className="p-2 rounded-lg bg-white hover:bg-slate-200 text-slate-700 shadow-sm transition-colors flex items-center gap-1"
              title="Cita Directiva (> texto)"
            >
              <Quote className="w-4 h-4 text-[#B08A1A]" />
            </button>

            <button
              type="button"
              onClick={() => insertMarkdown("\n\n- ", "\n- Elemento 2\n- Elemento 3", "Punto clave 1")}
              className="p-2 rounded-lg bg-white hover:bg-slate-200 text-slate-700 shadow-sm transition-colors"
              title="Lista con Viñetas (- item)"
            >
              <List className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => insertMarkdown("\n\n1. ", "\n2. Paso dos\n3. Paso tres", "Paso uno")}
              className="p-2 rounded-lg bg-white hover:bg-slate-200 text-slate-700 shadow-sm transition-colors"
              title="Lista Numerada (1. item)"
            >
              <ListOrdered className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-slate-300 mx-1" />

            {/* Cajas de Alerta Ejecutiva */}
            <button
              type="button"
              onClick={() => insertMarkdown("\n\n> [!NOTE]\n> ", "\n", "Contexto o análisis estratégico")}
              className="p-2 rounded-lg bg-white hover:bg-slate-200 text-blue-700 shadow-sm transition-colors flex items-center gap-1 text-xs font-semibold"
              title="Alerta Informativa (> [!NOTE])"
            >
              <Info className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Nota</span>
            </button>

            <button
              type="button"
              onClick={() => insertMarkdown("\n\n> [!IMPORTANT]\n> ", "\n", "Requisito obligatorio o normativo crítico")}
              className="p-2 rounded-lg bg-white hover:bg-slate-200 text-rose-700 shadow-sm transition-colors flex items-center gap-1 text-xs font-semibold"
              title="Alerta Normativa Obligatoria (> [!IMPORTANT])"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Norma</span>
            </button>

            <button
              type="button"
              onClick={() => insertMarkdown("\n\n> [!TIP]\n> ", "\n", "Recomendación práctica para optimización de tiempos y costos")}
              className="p-2 rounded-lg bg-white hover:bg-slate-200 text-amber-700 shadow-sm transition-colors flex items-center gap-1 text-xs font-semibold"
              title="Consejo Directivo (> [!TIP])"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Consejo</span>
            </button>

            <div className="w-px h-5 bg-slate-300 mx-1" />

            {/* Elementos Especiales */}
            <button
              type="button"
              onClick={() => insertMarkdown("\n\n| Variable / Factor | Norma ISO | Impacto |\n|---|---|---|\n| Trazabilidad | ISO 9001 | 100% |\n| Riesgos | ISO 31000 | Mitigado |\n\n")}
              className="p-2 rounded-lg bg-white hover:bg-slate-200 text-slate-700 shadow-sm transition-colors flex items-center gap-1 text-xs"
              title="Insertar Tabla Markdown"
            >
              <Table className="w-4 h-4 text-[#01426F]" />
              <span className="hidden lg:inline">Tabla</span>
            </button>

            <button
              type="button"
              onClick={() => insertMarkdown("[", "](https://neogestion.software)", "Texto del enlace")}
              className="p-2 rounded-lg bg-white hover:bg-slate-200 text-slate-700 shadow-sm transition-colors"
              title="Enlace ([texto](url))"
            >
              <LinkIcon className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => insertMarkdown("\n\n---\n\n")}
              className="p-2 rounded-lg bg-white hover:bg-slate-200 text-slate-700 shadow-sm transition-colors"
              title="Línea divisoria (---)"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          {/* VISTAS: REDACTAR / VISTA PREVIA / DIVIDIDA */}
          <div className="grid grid-cols-1 gap-6">
            
            {/* Modo Redacción */}
            {(activeView === "write" || activeView === "split") && (
              <div className="space-y-2">
                <textarea
                  ref={contentRef}
                  required
                  rows={14}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Redacte el artículo aquí... Puede usar los botones de la barra superior para insertar títulos (##), citas (>), viñetas (-), alertas (> [!NOTE]) y tablas."
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm leading-relaxed text-slate-900 focus:outline-none focus:border-[#B08A1A] focus:bg-white font-mono"
                />

                {/* Barra de Estadísticas de Redacción */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 px-2">
                  <div className="flex items-center gap-4">
                    <span><strong>{wordsCount}</strong> palabras</span>
                    <span><strong>{charsCount}</strong> caracteres</span>
                    <span><strong>~{estimatedMins} min</strong> de lectura</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#B08A1A] font-semibold">Formato Markdown Habilitado</span>
                  </div>
                </div>
              </div>
            )}

            {/* Modo Vista Previa en Vivo */}
            {(activeView === "preview" || activeView === "split") && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[600px] shadow-sm">
                <div className="border-b border-slate-100 pb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#B08A1A] bg-amber-500/10 px-2.5 py-1 rounded-full">
                    {formData.category}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-3">
                    {formData.title || "Título del Artículo en Vista Previa"}
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                    <span>Por <strong>{formData.authorName}</strong> ({formData.authorRole})</span>
                    <span>•</span>
                    <span>{formData.readTime}</span>
                  </div>
                </div>

                {/* Renderizado de Párrafos, Encabezados, Citas y Alertas */}
                <div className="space-y-4 text-slate-800 text-sm sm:text-base leading-relaxed">
                  {formData.content ? (
                    formData.content.split("\n\n").map((block, idx) => {
                      const trimmed = block.trim();
                      if (!trimmed) return null;

                      // Título H2
                      if (trimmed.startsWith("## ")) {
                        return (
                          <h3 key={idx} className="text-xl font-black text-slate-900 pt-4 pb-1 border-b border-slate-200 text-[#01426F]">
                            {trimmed.replace(/^##\s+/, "")}
                          </h3>
                        );
                      }

                      // Título H3
                      if (trimmed.startsWith("### ")) {
                        return (
                          <h4 key={idx} className="text-base font-bold text-slate-900 pt-2 text-[#B08A1A]">
                            {trimmed.replace(/^###\s+/, "")}
                          </h4>
                        );
                      }

                      // Cita
                      if (trimmed.startsWith('> "') || (trimmed.startsWith("> ") && !trimmed.startsWith("> [!"))) {
                        return (
                          <blockquote key={idx} className="p-4 my-3 rounded-2xl bg-amber-500/[0.06] border-l-4 border-[#B08A1A] text-slate-800 font-medium italic">
                            {trimmed.replace(/^>\s*/, "").replace(/^"/, "").replace(/"$/, "")}
                          </blockquote>
                        );
                      }

                      // Alerta [!NOTE]
                      if (trimmed.includes("[!NOTE]")) {
                        return (
                          <div key={idx} className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-2.5">
                            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                            <div>{trimmed.replace(/>\s*\[!NOTE\]\s*/g, "")}</div>
                          </div>
                        );
                      }

                      // Alerta [!IMPORTANT]
                      if (trimmed.includes("[!IMPORTANT]")) {
                        return (
                          <div key={idx} className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <div>{trimmed.replace(/>\s*\[!IMPORTANT\]\s*/g, "")}</div>
                          </div>
                        );
                      }

                      // Alerta [!TIP]
                      if (trimmed.includes("[!TIP]")) {
                        return (
                          <div key={idx} className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>{trimmed.replace(/>\s*\[!TIP\]\s*/g, "")}</div>
                          </div>
                        );
                      }

                      // Tabla
                      if (trimmed.includes("|") && trimmed.includes("---")) {
                        const lines = trimmed.split("\n").filter(l => l.includes("|"));
                        const headers = lines[0]?.split("|").filter(c => c.trim()).map(c => c.trim());
                        const rows = lines.slice(2).map(l => l.split("|").filter(c => c.trim()).map(c => c.trim()));

                        return (
                          <div key={idx} className="overflow-x-auto my-4 rounded-xl border border-slate-200">
                            <table className="min-w-full text-xs text-left">
                              <thead className="bg-[#01426F] text-white">
                                <tr>
                                  {headers?.map((h, hIdx) => (
                                    <th key={hIdx} className="px-4 py-2.5 font-bold">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200 bg-white">
                                {rows.map((row, rIdx) => (
                                  <tr key={rIdx} className="hover:bg-slate-50">
                                    {row.map((cell, cIdx) => (
                                      <td key={cIdx} className="px-4 py-2 text-slate-700">{cell}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      }

                      // Viñetas
                      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                        const items = trimmed.split("\n").map(i => i.replace(/^[-*]\s+/, "").trim());
                        return (
                          <ul key={idx} className="space-y-1.5 my-2 pl-2">
                            {items.map((it, itIdx) => (
                              <li key={itIdx} className="flex items-start gap-2 text-xs text-slate-700">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{it}</span>
                              </li>
                            ))}
                          </ul>
                        );
                      }

                      // Párrafo normal
                      return (
                        <p key={idx} className="text-slate-700 leading-relaxed text-xs sm:text-sm">
                          {trimmed}
                        </p>
                      );
                    })
                  ) : (
                    <div className="text-slate-400 italic text-xs text-center py-10">
                      El contenido que redacte se previsualizará aquí con formato enriquecido.
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* BLOQUE 5: ESTADO DE PUBLICACIÓN & ACCIONES */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="published"
              checked={formData.published}
              onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
              className="w-5 h-5 text-[#B08A1A] rounded border-slate-300 focus:ring-[#B08A1A] accent-[#B08A1A]"
            />
            <label htmlFor="published" className="text-xs font-bold text-slate-800 cursor-pointer">
              <span>Publicar inmediatamente en el Magazine visible para visitantes</span>
              <span className="block text-[11px] text-slate-400 font-normal">
                Si se desmarca, se guardará como borrador confidencial en el panel administrativo.
              </span>
            </label>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Link
              href={backHref}
              className="px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#B08A1A] to-[#D4AF37] text-slate-950 font-black text-xs hover:brightness-110 transition-all shadow-lg gold-glow disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEditing ? "Guardar Cambios del Artículo" : "Guardar y Publicar Artículo"}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
