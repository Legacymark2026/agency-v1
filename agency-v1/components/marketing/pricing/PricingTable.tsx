"use client";

import React, { useState } from "react";
import { ServicePrice } from "@/types/pricing";
import { Edit2, Trash2, GripVertical, Copy, Tag, Clock, ChevronDown, Check, Coins, Percent } from "lucide-react";
import { toast } from "react-hot-toast";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface PricingTableProps {
  items: ServicePrice[];
  onEdit: (item: ServicePrice) => void;
  onDelete: (id: string) => void;
  onInlineEdit: (id: string, field: keyof ServicePrice, value: any) => void;
  onReorder: (items: ServicePrice[]) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

const formatMoney = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(Math.round(val));

function SortableCard({ 
  item, 
  isSelected, 
  onToggleSelect, 
  onEdit, 
  onDelete, 
  onInlineEdit 
}: { 
  item: ServicePrice; 
  isSelected: boolean; 
  onToggleSelect: (id: string) => void;
  onEdit: (i:ServicePrice)=>void;
  onDelete: (id:string)=>void;
  onInlineEdit: (id: string, f: keyof ServicePrice, val: any) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 1,
  };

  const [editPrice, setEditPrice] = useState<string | null>(null);

  // Financial Math
  const iva = item.precio_base * (item.iva_porcentaje / 100);
  const subtotal = item.precio_base + iva;
  const reteiva = iva * (item.reteiva_porc / 100);
  const retefuente = item.precio_base * (item.retefuente_porc / 100);
  const ica = item.precio_base * (item.ica_porc / 100);

  const handleCopy = () => {
    const text = `🔹 *${item.nombre_servicio}*\n${item.descripcion}\n\n💰 Precio: $${item.precio_base}`;
    navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles");
  };

  return (
    <div 
        ref={setNodeRef} 
        style={{ ...style, padding: '1rem' }} 
        className={`ds-card-sm group flex flex-col md:flex-row md:items-center gap-4 !transition-all !duration-300
        ${isDragging ? '!border-teal-500/50 shadow-[0_8px_30px_rgb(0,0,0,0.5)] scale-[1.02] z-50' : ''} 
        ${isSelected ? '!border-teal-600/40 !bg-[rgba(13,148,136,0.1)]' : ''}`}
    >
      {/* Selection & Drag Handle */}
      <div className="flex items-center gap-3 md:w-16 flex-shrink-0">
        <button {...attributes} {...listeners} className="text-slate-600 hover:text-slate-300 cursor-grab active:cursor-grabbing p-1">
          <GripVertical className="w-5 h-5" />
        </button>
        <input 
          type="checkbox" 
          checked={isSelected}
          onChange={() => onToggleSelect(item.id)}
          className="w-4 h-4 rounded border-slate-700 bg-slate-900 accent-teal-500 cursor-pointer"
        />
      </div>

      {/* Main Info */}
      <div className="flex-grow min-w-[200px] flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-1.5">
           {item.codigo_id && (
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-[0.1em] bg-slate-800/80 text-amber-500/90 border border-slate-700">
                {item.codigo_id}
              </span>
           )}
           <span
              onClick={() => onInlineEdit(item.id, "estado", item.estado === "activo" ? "inactivo" : "activo")}
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-[0.1em] border cursor-pointer hover:opacity-80 transition-opacity ${
                item.estado === "activo"
                  ? "bg-teal-950/60 text-teal-400 border-teal-900/50"
                  : "bg-slate-900 text-slate-500 border-slate-800"
              }`}
           >
              {item.estado === "activo" ? "ACTIVO" : "INACTIVO"}
           </span>
        </div>
        <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            {item.nombre_servicio}
        </h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-slate-500" /> {item.categoria} {item.tipo_formato && `• ${item.tipo_formato}`}</span>
            {item.tiempo_estimado && <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-500" /> {item.tiempo_estimado}</span>}
        </div>
      </div>

      {/* Pricing Module */}
      <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center min-w-[200px] p-3 rounded-lg bg-black/40 border border-slate-800/50 relative group/price">
        <div className="flex flex-col items-start md:items-end w-full">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-0.5">Precio Base (Sin IVA)</span>
            {editPrice !== null ? (
                <input 
                  autoFocus
                  type="number" 
                  className="w-28 bg-slate-950 border border-teal-600 rounded px-2 py-1 text-base font-mono outline-none text-white focus:ring-1 focus:ring-teal-500"
                  value={editPrice}
                  onChange={e => setEditPrice(e.target.value)}
                  onBlur={() => {
                    onInlineEdit(item.id, "precio_base", Number(editPrice));
                    setEditPrice(null);
                  }}
                  onKeyDown={e => {
                      if (e.key === 'Enter') {
                          onInlineEdit(item.id, "precio_base", Number(editPrice));
                          setEditPrice(null);
                      }
                      if (e.key === 'Escape') setEditPrice(null);
                  }}
                />
            ) : (
                <div 
                   onClick={() => setEditPrice(item.precio_base.toString())}
                   className="text-lg font-bold text-amber-400 cursor-pointer border-b border-transparent hover:border-amber-900 leading-tight" 
                   title="Clic para editar precio"
                >
                    {formatMoney(item.precio_base)}
                </div>
            )}
            
            <div className="flex flex-col md:flex-row items-baseline gap-2 mt-1">
               <span className="text-xs text-slate-400 font-mono">+ {formatMoney(iva)} IVA</span>
               <span className="text-sm font-bold text-teal-400 font-mono border-l border-slate-700 pl-2 ml-2">Total: {formatMoney(subtotal)}</span>
            </div>
        </div>

        {/* Taxes Tooltip Hover (Desktop) / Expand (Mobile) */}
        <div className="md:absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-700 shadow-2xl rounded-lg overflow-hidden z-30
            hidden md:group-hover/price:block">
            <div className="bg-slate-800 px-3 py-1.5 text-[10px] uppercase text-slate-400 tracking-wider font-bold">
                Retenciones Aplicables
            </div>
            <div className="p-2 space-y-1">
                <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-400 text-[10px]">ReteIVA ({item.reteiva_porc}%)</span>
                    <span className="text-red-400">{formatMoney(reteiva)}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-400 text-[10px]">ReteFuente ({item.retefuente_porc}%)</span>
                    <span className="text-red-400">{formatMoney(retefuente)}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-400 text-[10px]">ICA ({item.ica_porc}%)</span>
                    <span className="text-red-400">{formatMoney(ica)}</span>
                </div>
            </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-1.5 md:w-24 mt-2 md:mt-0 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
        <button aria-label="Copiar detalles del precio" onClick={handleCopy} title="Copiar detalles" className="p-2 text-slate-400 hover:text-teal-400 hover:bg-slate-800 rounded-lg transition-colors"><Copy className="w-4 h-4" /></button>
        <button aria-label="Editar precio" onClick={() => onEdit(item)} title="Editar" className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
        <button aria-label="Eliminar precio" onClick={() => onDelete(item.id)} title="Eliminar" className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
      </div>

    </div>
  );
}

export function PricingTable({ items, onEdit, onDelete, onInlineEdit, onReorder, selectedIds, onSelectionChange }: PricingTableProps) {
  
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over?.id);
      onReorder(arrayMove(items, oldIndex, newIndex));
    }
  };

  const toggleAll = () => {
      if (selectedIds.length === items.length) {
          onSelectionChange([]);
      } else {
          onSelectionChange(items.map(i => i.id));
      }
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center bg-slate-900/50 border border-dashed border-slate-800 rounded-xl">
        <p className="text-slate-400 font-mono text-sm">No hay servicios registrados en esta categoría.</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Top action bar for bulk selection state */}
      <div className="px-4 py-3 border border-[rgba(30,41,59,0.8)] bg-[rgba(15,23,42,0.8)] rounded-sm flex justify-between items-center text-sm mb-2 shadow-sm">
         <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              checked={selectedIds.length === items.length && items.length > 0} 
              onChange={toggleAll}
              className="w-4 h-4 rounded-sm border-slate-700 bg-slate-900 accent-teal-500 cursor-pointer" 
              id="selectAll"
            />
            <label htmlFor="selectAll" className="text-slate-300 font-medium cursor-pointer font-mono text-[11px] uppercase tracking-wider">
              Seleccionar todos [{items.length}]
            </label>
         </div>
         <div className="text-slate-500 font-mono text-[10px] uppercase tracking-wider hidden sm:block">
            Arrástralos para priorizar el portafolio
         </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {items.map((item) => (
                <SortableRowWrapper 
                   key={item.id} 
                   item={item} 
                   isSelected={selectedIds.includes(item.id)}
                   onToggleSelect={(id) => onSelectionChange(selectedIds.includes(id) ? selectedIds.filter(i => i !== id) : [...selectedIds, id])}
                   onEdit={onEdit} 
                   onDelete={onDelete} 
                   onInlineEdit={onInlineEdit}
                />
              ))}
            </div>
          </SortableContext>
      </DndContext>
    </div>
  );
}

// Ensure the name maps correctly internally for the drag wrapper
const SortableRowWrapper = SortableCard;
