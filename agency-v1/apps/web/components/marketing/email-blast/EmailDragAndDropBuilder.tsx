'use client';

import { useState, useMemo } from 'react';
import {
  Layout, Type, Image as ImageIcon, MousePointer, Minus, Columns,
  Tag, Sparkles, Star, Smartphone, Tablet, Monitor, Moon, Sun, Copy, Check, Eye, Code, Trash2, ArrowUp, ArrowDown, Plus
} from 'lucide-react';

export type PresetBlockType =
  | 'header'
  | 'text'
  | 'image'
  | 'button'
  | 'divider'
  | 'hero_banner'
  | 'product_card'
  | 'coupon_code'
  | 'testimonial'
  | 'footer';

export interface EmailBlockItem {
  id: string;
  type: PresetBlockType;
  title?: string;
  subtitle?: string;
  content?: string;
  url?: string;
  alt?: string;
  width?: number;
  height?: number;
  align?: 'left' | 'center' | 'right';
  label?: string;
  linkUrl?: string;
  bgColor?: string;
  textColor?: string;

  // Campos avanzados
  imageUrl?: string;
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  ctaUrl?: string;
  price?: string;
  originalPrice?: string;
  description?: string;
  buttonText?: string;
  buttonUrl?: string;
  code?: string;
  discountText?: string;
  expiresText?: string;
  quote?: string;
  authorName?: string;
  authorTitle?: string;
  avatarUrl?: string;
}

export interface EmailDragAndDropBuilderProps {
  initialBlocks?: EmailBlockItem[];
  onChangeDesignJson: (json: any) => void;
}

const DYNAMIC_VARIABLES = [
  { label: 'Nombre del Cliente', value: '{{name}}' },
  { label: 'Email del Destinatario', value: '{{email}}' },
  { label: 'Nombre de la Empresa', value: '{{companyName}}' },
  { label: 'Código de Descuento', value: '{{discountCode}}' },
  { label: 'Enlace de Desuscripción', value: '{{unsubscribeLink}}' },
];

export function EmailDragAndDropBuilder({
  initialBlocks = [],
  onChangeDesignJson
}: EmailDragAndDropBuilderProps) {
  const [activeTab, setActiveTab] = useState<'BUILDER' | 'PREVIEW'>('BUILDER');
  const [previewDevice, setPreviewDevice] = useState<'DESKTOP' | 'TABLET' | 'MOBILE'>('DESKTOP');
  const [darkModePreview, setDarkModePreview] = useState(true);

  const [blocks, setBlocks] = useState<EmailBlockItem[]>(() => {
    if (initialBlocks && initialBlocks.length > 0) return initialBlocks;
    return [
      {
        id: '1',
        type: 'hero_banner',
        imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0',
        headline: '¡Hola {{name}}, Oferta Especial!',
        subheadline: 'Aprovecha un 30% de descuento en tu cuenta de {{companyName}}',
        ctaText: 'Reclamar Bono',
        ctaUrl: 'https://legacymarksas.com/promocion'
      },
      {
        id: '2',
        type: 'coupon_code',
        code: '{{discountCode}}',
        discountText: 'Tu cupón exclusivo de bienvenida',
        expiresText: 'Válido durante 48 horas únicamente'
      },
      {
        id: '3',
        type: 'product_card',
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
        title: 'Plan LegacyMark Enterprise',
        price: '$299 USD',
        originalPrice: '$499 USD',
        description: 'IA automatizada y envío masivo sin límites.',
        buttonText: 'Obtener Ahora',
        buttonUrl: 'https://legacymarksas.com/checkout'
      },
      {
        id: '4',
        type: 'footer',
        title: '{{companyName}} SAS'
      }
    ];
  });

  const [copiedVar, setCopiedVar] = useState<string | null>(null);

  const notifyChanges = (updatedBlocks: EmailBlockItem[]) => {
    const designJson = {
      bgColor: '#0f172a',
      cardBgColor: '#1e293b',
      blocks: updatedBlocks
    };
    onChangeDesignJson(designJson);
  };

  const addPresetBlock = (type: PresetBlockType) => {
    let newBlock: EmailBlockItem = { id: String(Date.now()), type };

    if (type === 'hero_banner') {
      newBlock = {
        ...newBlock,
        imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0',
        headline: '¡Nuevo Lanzamiento Exclusivo!',
        subheadline: 'Descubre las nuevas herramientas impulsadas por IA',
        ctaText: 'Conocer Más',
        ctaUrl: 'https://legacymarksas.com'
      };
    } else if (type === 'product_card') {
      newBlock = {
        ...newBlock,
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
        title: 'Producto / Servicio Destacado',
        price: '$99 USD',
        originalPrice: '$149 USD',
        description: 'Descripción atractiva del producto para tus suscriptores.',
        buttonText: 'Ver Detalles',
        buttonUrl: 'https://legacymarksas.com'
      };
    } else if (type === 'coupon_code') {
      newBlock = {
        ...newBlock,
        code: '{{discountCode}}',
        discountText: 'Descuento especial del 25%',
        expiresText: 'Expira este fin de semana'
      };
    } else if (type === 'testimonial') {
      newBlock = {
        ...newBlock,
        quote: 'LegacyMark aumentó nuestra conversión de correo en un 40%.',
        authorName: 'María Fernanda Ruiz',
        authorTitle: 'Directora de Marketing',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb'
      };
    } else if (type === 'button') {
      newBlock = {
        ...newBlock,
        label: 'Ver Promoción',
        url: 'https://legacymarksas.com',
        bgColor: '#0d9488'
      };
    } else if (type === 'text') {
      newBlock = {
        ...newBlock,
        content: 'Hola {{name}}, nos complace saludarte...'
      };
    }

    const nextBlocks = [...blocks, newBlock];
    setBlocks(nextBlocks);
    notifyChanges(nextBlocks);
  };

  const updateBlock = (id: string, fields: Partial<EmailBlockItem>) => {
    const nextBlocks = blocks.map((b) => (b.id === id ? { ...b, ...fields } : b));
    setBlocks(nextBlocks);
    notifyChanges(nextBlocks);
  };

  const moveBlock = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;

    const nextBlocks = [...blocks];
    const temp = nextBlocks[index];
    nextBlocks[index] = nextBlocks[targetIndex];
    nextBlocks[targetIndex] = temp;

    setBlocks(nextBlocks);
    notifyChanges(nextBlocks);
  };

  const removeBlock = (id: string) => {
    const nextBlocks = blocks.filter((b) => b.id !== id);
    setBlocks(nextBlocks);
    notifyChanges(nextBlocks);
  };

  const copyVariable = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedVar(val);
    setTimeout(() => setCopiedVar(null), 2000);
  };

  return (
    <div className="flex flex-col h-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('BUILDER')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'BUILDER'
                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40 shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Layout className="w-4 h-4" />
            Constructor Drag & Drop
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('PREVIEW')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'PREVIEW'
                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40 shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Eye className="w-4 h-4" />
            Previsualizador Multi-Dispositivo
          </button>
        </div>

        {activeTab === 'PREVIEW' && (
          <div className="flex items-center gap-3">
            {/* Device Switcher */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setPreviewDevice('DESKTOP')}
                className={`p-2 rounded-lg transition-all ${
                  previewDevice === 'DESKTOP' ? 'bg-teal-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Escritorio (1920px)"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('TABLET')}
                className={`p-2 rounded-lg transition-all ${
                  previewDevice === 'TABLET' ? 'bg-teal-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Tablet (768px)"
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('MOBILE')}
                className={`p-2 rounded-lg transition-all ${
                  previewDevice === 'MOBILE' ? 'bg-teal-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Móvil (375px)"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>

            {/* Dark Mode Simulator */}
            <button
              type="button"
              onClick={() => setDarkModePreview(!darkModePreview)}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-amber-400"
              title="Simular Modo Oscuro/Claro"
            >
              {darkModePreview ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>

      {/* Main Container */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activeTab === 'BUILDER' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sidebar Component Selector & Variables Chips */}
            <div className="lg:col-span-4 space-y-6">
              {/* Componentes Pre-diseñados Reutilizables */}
              <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="text-xs font-black text-teal-400 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Biblioteca de Componentes
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { type: 'hero_banner', name: 'Hero Banner Destacado', icon: Sparkles },
                    { type: 'product_card', name: 'Ficha de Producto con Precio', icon: Tag },
                    { type: 'coupon_code', name: 'Caja de Cupón Promocional', icon: Tag },
                    { type: 'testimonial', name: 'Reseña / Testimonio', icon: Star },
                    { type: 'button', name: 'Botón de Acción (CTA)', icon: MousePointer },
                    { type: 'text', name: 'Texto Enriquecido', icon: Type }
                  ].map(({ type, name, icon: Icon }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => addPresetBlock(type as PresetBlockType)}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-teal-500/50 hover:bg-slate-800/40 text-left transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-slate-200">{name}</span>
                      </div>
                      <Plus className="w-4 h-4 text-slate-500 group-hover:text-teal-400" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Selector de Variables Dinámicas */}
              <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Variables Dinámicas
                </h3>
                <p className="text-[11px] text-slate-400">Haz clic en una variable para copiarla e insertarla en tus bloques:</p>
                <div className="flex flex-wrap gap-2">
                  {DYNAMIC_VARIABLES.map((v) => (
                    <button
                      key={v.value}
                      type="button"
                      onClick={() => copyVariable(v.value)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/50 text-amber-300 text-xs font-mono transition-all"
                    >
                      {copiedVar === v.value ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {v.value}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Canvas Principal de Construcción */}
            <div className="lg:col-span-8 space-y-4">
              {blocks.map((block, idx) => (
                <div
                  key={block.id}
                  className="bg-slate-900 p-5 rounded-2xl border border-slate-800 relative hover:border-teal-500/40 transition-all space-y-3 shadow-lg"
                >
                  {/* Header de Bloque */}
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-xs font-black text-teal-400 uppercase tracking-wider">
                      #{idx + 1} Componente — {block.type.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveBlock(idx, 'UP')}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-20"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBlock(idx, 'DOWN')}
                        disabled={idx === blocks.length - 1}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-20"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBlock(block.id)}
                        className="p-1 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Formularios Inspector por Tipo de Componente */}
                  {block.type === 'hero_banner' && (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={block.imageUrl || ''}
                        onChange={(e) => updateBlock(block.id, { imageUrl: e.target.value })}
                        placeholder="URL de Imagen de Fondo..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                      />
                      <input
                        type="text"
                        value={block.headline || ''}
                        onChange={(e) => updateBlock(block.id, { headline: e.target.value })}
                        placeholder="Titular de Impacto..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white"
                      />
                      <input
                        type="text"
                        value={block.subheadline || ''}
                        onChange={(e) => updateBlock(block.id, { subheadline: e.target.value })}
                        placeholder="Subtitular descriptivo..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300"
                      />
                    </div>
                  )}

                  {block.type === 'product_card' && (
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={block.title || ''}
                        onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                        placeholder="Nombre del Producto..."
                        className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      />
                      <input
                        type="text"
                        value={block.price || ''}
                        onChange={(e) => updateBlock(block.id, { price: e.target.value })}
                        placeholder="Precio ($99 USD)..."
                        className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-teal-400 font-bold"
                      />
                    </div>
                  )}

                  {block.type === 'coupon_code' && (
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={block.code || ''}
                        onChange={(e) => updateBlock(block.id, { code: e.target.value })}
                        placeholder="Código de Descuento..."
                        className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono"
                      />
                      <input
                        type="text"
                        value={block.discountText || ''}
                        onChange={(e) => updateBlock(block.id, { discountText: e.target.value })}
                        placeholder="Descripción de la Promoción..."
                        className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'PREVIEW' && (
          <div className="flex justify-center transition-all">
            <div
              className={`rounded-2xl border border-slate-800 shadow-2xl p-6 transition-all ${
                darkModePreview ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'
              } ${
                previewDevice === 'DESKTOP'
                  ? 'w-[750px]'
                  : previewDevice === 'TABLET'
                  ? 'w-[520px]'
                  : 'w-[375px]'
              }`}
            >
              <div className="space-y-6">
                {blocks.map((b) => (
                  <div key={b.id}>
                    {b.type === 'hero_banner' && (
                      <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-900 text-center p-6 space-y-3">
                        <img src={b.imageUrl} alt="Hero" className="w-full h-40 object-cover rounded-lg" />
                        <h2 className="text-xl font-bold text-white">{b.headline}</h2>
                        <p className="text-xs text-slate-400">{b.subheadline}</p>
                      </div>
                    )}

                    {b.type === 'coupon_code' && (
                      <div className="border-2 dashed border-teal-500 rounded-xl p-5 text-center bg-teal-500/10 space-y-2">
                        <p className="text-xs font-bold text-teal-400 uppercase tracking-wider">{b.discountText}</p>
                        <div className="text-xl font-black font-mono text-white bg-slate-900 px-4 py-2 rounded-lg inline-block">
                          {b.code}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
