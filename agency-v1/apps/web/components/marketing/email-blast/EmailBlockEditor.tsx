'use client';

import { useState, useMemo } from 'react';
import { Layout, Type, Image as ImageIcon, MousePointer, Minus, Columns, Share2, Eye, Code, Trash2, ArrowUp, ArrowDown, Upload, Link as LinkIcon, Plus, Check } from 'lucide-react';

export type BlockType = 'header' | 'text' | 'image' | 'button' | 'divider' | 'columns' | 'social' | 'footer';

export interface EmailBlockItem {
  id: string;
  type: BlockType;
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
}

export interface EmailBlockEditorProps {
  initialBlocks?: EmailBlockItem[];
  htmlBody: string;
  onChangeHtml: (html: string) => void;
  onChangeDesignJson: (json: any) => void;
}

export function EmailBlockEditor({
  initialBlocks = [],
  htmlBody,
  onChangeHtml,
  onChangeDesignJson
}: EmailBlockEditorProps) {
  const [activeTab, setActiveTab] = useState<'VISUAL' | 'CODE' | 'PREVIEW'>('VISUAL');
  const [previewDevice, setPreviewDevice] = useState<'DESKTOP' | 'MOBILE'>('DESKTOP');

  const [blocks, setBlocks] = useState<EmailBlockItem[]>(() => {
    if (initialBlocks && initialBlocks.length > 0) return initialBlocks;
    return [
      { id: '1', type: 'header', title: '¡Hola {{name}}!', subtitle: 'Tenemos novedades exclusivas para ti' },
      { id: '2', type: 'text', content: '<p>Te damos la bienvenida a nuestra nueva campaña de LegacyMark.</p>' },
      { id: '3', type: 'button', label: 'Ver Novedades', url: 'https://legacymarksas.com', bgColor: '#0d9488' },
      { id: '4', type: 'footer', title: 'LegacyMark SAS' }
    ];
  });

  // Modal para agregar/gestionar imágenes
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedBlockIdForImage, setSelectedBlockIdForImage] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageAltInput, setImageAltInput] = useState('');
  const [imageLinkInput, setImageLinkInput] = useState('');

  // Notificar cambios al componente padre
  const notifyChanges = (updatedBlocks: EmailBlockItem[]) => {
    const designJson = {
      bgColor: '#0f172a',
      cardBgColor: '#1e293b',
      blocks: updatedBlocks.map((b) => ({
        type: b.type,
        title: b.title,
        subtitle: b.subtitle,
        content: b.content,
        url: b.url,
        alt: b.alt,
        width: b.width,
        height: b.height,
        align: b.align || 'center',
        label: b.label,
        linkUrl: b.linkUrl,
        bgColor: b.bgColor,
        textColor: b.textColor
      }))
    };

    onChangeDesignJson(designJson);
  };

  const addBlock = (type: BlockType) => {
    const newBlock: EmailBlockItem = {
      id: String(Date.now()),
      type,
      align: 'center',
      ...(type === 'text' ? { content: '<p>Nuevo párrafo de texto editable.</p>' } : {}),
      ...(type === 'button' ? { label: 'Haz Clic Aquí', url: 'https://legacymarksas.com', bgColor: '#0d9488' } : {}),
      ...(type === 'image' ? { url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0', alt: 'Imagen de Campaña', width: 500 } : {}),
      ...(type === 'header' ? { title: 'Título Principal', subtitle: 'Subtítulo informativo' } : {}),
      ...(type === 'footer' ? { title: 'LegacyMark SAS' } : {})
    };

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

  const handleInsertImage = () => {
    if (!selectedBlockIdForImage || !imageUrlInput) return;
    updateBlock(selectedBlockIdForImage, {
      url: imageUrlInput,
      alt: imageAltInput,
      linkUrl: imageLinkInput
    });
    setShowImageModal(false);
    setImageUrlInput('');
    setImageAltInput('');
    setImageLinkInput('');
  };

  return (
    <div className="flex flex-col h-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/90 shadow-2xl">
      {/* Header Tabs */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('VISUAL')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'VISUAL'
                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Layout className="w-4 h-4" />
            Editor Visual de Bloques
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('CODE')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'CODE'
                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Code className="w-4 h-4" />
            Código HTML Directo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('PREVIEW')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'PREVIEW'
                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Eye className="w-4 h-4" />
            Vista Previa Responsive
          </button>
        </div>

        {activeTab === 'PREVIEW' && (
          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setPreviewDevice('DESKTOP')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                previewDevice === 'DESKTOP' ? 'bg-teal-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Escritorio
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice('MOBILE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                previewDevice === 'MOBILE' ? 'bg-teal-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Móvil (iPhone)
            </button>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activeTab === 'VISUAL' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Toolbar Lateral de Inserción */}
            <div className="lg:col-span-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Añadir Bloque al Correo</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { type: 'header', label: 'Encabezado', icon: Layout },
                  { type: 'text', label: 'Texto / Párrafo', icon: Type },
                  { type: 'image', label: 'Imagen', icon: ImageIcon },
                  { type: 'button', label: 'Botón CTA', icon: MousePointer },
                  { type: 'divider', label: 'Separador', icon: Minus },
                  { type: 'footer', label: 'Pie de Página', icon: Layout }
                ].map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => addBlock(type as BlockType)}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 border border-slate-800/80 hover:border-teal-500/50 hover:bg-slate-800/50 text-slate-300 hover:text-teal-400 transition-all text-xs font-medium gap-2"
                  >
                    <Icon className="w-5 h-5 text-teal-400" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Canvas de Construcción de Bloques */}
            <div className="lg:col-span-8 space-y-4">
              {blocks.map((block, idx) => (
                <div
                  key={block.id}
                  className="bg-slate-950/80 p-5 rounded-xl border border-slate-800 relative group hover:border-teal-500/40 transition-all"
                >
                  <div className="flex items-center justify-between mb-3 border-b border-slate-800/60 pb-2">
                    <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                      Bloque #{idx + 1} — {block.type}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveBlock(idx, 'UP')}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBlock(idx, 'DOWN')}
                        disabled={idx === blocks.length - 1}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
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

                  {/* Inspector de Bloque */}
                  {block.type === 'header' && (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={block.title || ''}
                        onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                        placeholder="Título del encabezado..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                      />
                      <input
                        type="text"
                        value={block.subtitle || ''}
                        onChange={(e) => updateBlock(block.id, { subtitle: e.target.value })}
                        placeholder="Subtítulo..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  )}

                  {block.type === 'text' && (
                    <div>
                      <textarea
                        value={block.content || ''}
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        rows={3}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  )}

                  {block.type === 'image' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={block.url}
                          alt={block.alt || 'Preview'}
                          className="w-20 h-20 object-cover rounded-lg border border-slate-800 bg-slate-900"
                        />
                        <div className="flex-1 space-y-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBlockIdForImage(block.id);
                              setImageUrlInput(block.url || '');
                              setImageAltInput(block.alt || '');
                              setImageLinkInput(block.linkUrl || '');
                              setShowImageModal(true);
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold"
                          >
                            <ImageIcon className="w-4 h-4" />
                            Configurar / Cambiar Imagen
                          </button>
                          <p className="text-[11px] text-slate-500 truncate">{block.url}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {block.type === 'button' && (
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={block.label || ''}
                        onChange={(e) => updateBlock(block.id, { label: e.target.value })}
                        placeholder="Texto del Botón..."
                        className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                      />
                      <input
                        type="text"
                        value={block.url || ''}
                        onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                        placeholder="URL de Destino (https://...)"
                        className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'CODE' && (
          <div>
            <textarea
              value={htmlBody}
              onChange={(e) => onChangeHtml(e.target.value)}
              rows={16}
              className="w-full font-mono bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-teal-300 focus:outline-none focus:border-teal-500"
            />
          </div>
        )}

        {activeTab === 'PREVIEW' && (
          <div className="flex justify-center">
            <div
              className={`bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl p-4 transition-all ${
                previewDevice === 'MOBILE' ? 'w-[375px]' : 'w-full max-w-[650px]'
              }`}
            >
              <iframe
                srcDoc={htmlBody || '<p style="color:white;">Sin contenido compilado</p>'}
                title="Preview"
                className="w-full min-h-[500px] border-0 rounded-xl bg-slate-900"
              />
            </div>
          </div>
        )}
      </div>

      {/* Modal de Imagen */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-teal-400" />
              Gestor de Imagen de Campaña
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">URL de la Imagen</label>
                <input
                  type="text"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Texto Alternativo (ALT)</label>
                <input
                  type="text"
                  value={imageAltInput}
                  onChange={(e) => setImageAltInput(e.target.value)}
                  placeholder="Descripción para lectores de pantalla..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Hipervínculo al hacer Clic (Opcional)</label>
                <input
                  type="text"
                  value={imageLinkInput}
                  onChange={(e) => setImageLinkInput(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleInsertImage}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-500 text-white hover:bg-teal-400"
              >
                Guardar Imagen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
