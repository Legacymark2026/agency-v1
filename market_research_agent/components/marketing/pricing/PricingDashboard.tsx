"use client";

import { useEffect, useState, useTransition } from "react";
import { Plus, Search, HelpCircle, Loader2, Link as LinkIcon, CheckCircle2, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { ServicePrice } from "@/types/pricing";
import { PricingTable } from "./PricingTable";
import { PricingFormModal } from "./PricingFormModal";
import { TermsAndConditions } from "./TermsAndConditions";
import { 
  getServicePrices, 
  createServicePrice, 
  updateServicePrice, 
  deleteServicePrice,
  reorderServicePrices,
  bulkUpdateServicePricesStatus,
  bulkDeleteServicePrices 
} from "@/app/actions/pricing";
import { toast } from "react-hot-toast";

export function PricingDashboard() {
  const [items, setItems] = useState<ServicePrice[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ServicePrice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  
  // Filters & Selection
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("Todos");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    getServicePrices().then(data => {
      setItems(data as unknown as ServicePrice[]);
      setIsLoading(false);
    });
  }, []);

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.nombre_servicio.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "Todos" || item.categoria === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (item: ServicePrice) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleInlineEdit = (id: string, field: keyof ServicePrice, value: any) => {
    const originalItem = items.find(i => i.id === id);
    if (!originalItem) return;

    if (originalItem[field] === value) return; // No change

    // Optimistic Update
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    
    startTransition(async () => {
      await updateServicePrice(id, {
        codigo_id: field === "codigo_id" ? value : originalItem.codigo_id,
        nombre_servicio: field === "nombre_servicio" ? value : originalItem.nombre_servicio,
        categoria: field === "categoria" ? value : originalItem.categoria,
        tipo_formato: field === "tipo_formato" ? value : originalItem.tipo_formato,
        tiempo_estimado: field === "tiempo_estimado" ? value : originalItem.tiempo_estimado,
        herramientas: field === "herramientas" ? value : originalItem.herramientas,
        descripcion: field === "descripcion" ? value : originalItem.descripcion,
        precio_base: field === "precio_base" ? value : originalItem.precio_base,
        iva_porcentaje: field === "iva_porcentaje" ? value : originalItem.iva_porcentaje,
        retefuente_porc: field === "retefuente_porc" ? value : originalItem.retefuente_porc,
        reteiva_porc: field === "reteiva_porc" ? value : originalItem.reteiva_porc,
        ica_porc: field === "ica_porc" ? value : originalItem.ica_porc,
        precio_urgente: field === "precio_urgente" ? value : originalItem.precio_urgente,
        isExpress: field === "isExpress" ? value : originalItem.isExpress,
        estado: field === "estado" ? value : originalItem.estado,
      });
      toast.success("Actualizado");
    });
  };

  const handleDelete = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
    setSelectedIds(prev => prev.filter(selId => selId !== id));
    startTransition(async () => {
      await deleteServicePrice(id);
      toast.success("Servicio eliminado");
    });
  };

  const handleSubmit = (formData: Omit<ServicePrice, "id" | "orderIndex">) => {
    if (editingItem) {
      setItems(items.map(item => item.id === editingItem.id ? { ...item, ...formData } : item));
      startTransition(async () => {
         await updateServicePrice(editingItem.id, formData);
         toast.success("Servicio actualizado");
      });
    } else {
      const tempId = "temp-" + Math.random().toString(36).substr(2, 9);
      const newIndex = items.length;
      setItems([...items, { ...formData, id: tempId, orderIndex: newIndex } as ServicePrice]);
      
      startTransition(async () => {
        const res = await createServicePrice({...formData});
        if (res) {
            setItems(prev => prev.map(i => i.id === tempId ? res as unknown as ServicePrice : i));
        }
        toast.success("Servicio guardado");
      });
    }
  };

  const handleReorder = (reorderedItems: ServicePrice[]) => {
    // Update local state optimistically
    const updatedWithIndexes = reorderedItems.map((item, index) => ({ ...item, orderIndex: index }));
    setItems(updatedWithIndexes);

    // Send delta to backend
    const updates = updatedWithIndexes.map(i => ({ id: i.id, orderIndex: i.orderIndex }));
    startTransition(async () => {
        await reorderServicePrices(updates);
    });
  };

  const handleBulkStatusChange = (status: "activo" | "inactivo") => {
    setItems(prev => prev.map(i => selectedIds.includes(i.id) ? { ...i, estado: status } : i));
    startTransition(async () => {
        await bulkUpdateServicePricesStatus(selectedIds, status);
        toast.success(`Servicios actualizados a ${status}`);
        setSelectedIds([]);
    });
  }

  const handleBulkDelete = () => {
    setItems(prev => prev.filter(i => !selectedIds.includes(i.id)));
    startTransition(async () => {
      await bulkDeleteServicePrices(selectedIds);
      toast.success("Servicios eliminados");
      setSelectedIds([]);
    });
  };

  const uniqueCategories = ["Todos", ...Array.from(new Set(items.map(i => i.categoria))).sort()];

  return (
    <>
      <div className="ds-page space-y-8">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.025] pointer-events-none mix-blend-screen" />
        
        {/* Header Section */}
        <div className="relative z-10 ds-card group" style={{ padding: '2rem 2.5rem' }}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(ellipse_at_top_right,rgba(13,148,136,0.07),transparent_70%)] pointer-events-none" />
          <div className="absolute top-4 right-4 font-mono text-[9px] text-slate-700 uppercase tracking-widest">[MKT_SYS · PRICING]</div>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/40 to-transparent" />

          <header className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="mb-4">
                 <span className="ds-badge ds-badge-teal">
                    <span className="relative flex h-1.5 w-1.5">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                       <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
                    </span>
                    Gestión de Oferta · Live
                 </span>
              </div>
              <h1 className="ds-heading-page">
                 Tarifario Dinámico
              </h1>
              <p className="ds-subtext mt-3 text-slate-400 max-w-xl normal-case">
                 Administra los servicios de la agencia. Arrastra las filas para ordenarlas como las verá el cliente.
              </p>
            </div>

            <button
               onClick={handleAddNew}
               className="group relative inline-flex items-center gap-2 px-5 py-2.5 bg-teal-900/40 border border-teal-500/30 rounded hover:bg-teal-800/60 transition-all font-mono text-[10px] text-teal-300 uppercase tracking-widest whitespace-nowrap"
             >
               <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
               Nuevo Servicio
            </button>
          </header>
        </div>

        {/* Action Panel */}
        <div className="relative z-10 ds-section flex flex-col sm:flex-row justify-between items-center gap-4 py-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar servicio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-900/60 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-[#d4af37]/40 focus:ring-1 focus:ring-[#d4af37]/40 transition-all"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar scroll-smooth">
            {uniqueCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all border ${
                  categoryFilter === cat
                    ? "bg-[#0b3936] text-emerald-100 border-emerald-700/50"
                    : "bg-zinc-900/50 text-zinc-400 border-zinc-800 hover:bg-zinc-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        {/* Data Table / Cards */}
        <div className="relative z-10 ds-section min-h-[300px]">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="ds-badge ds-badge-teal animate-pulse">Cargando módulos...</span>
            </div>
          ) : (
            <div className={`transition-opacity ${isPending ? 'opacity-70 pointer-events-none' : 'opacity-100'}`}>
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono py-2 gap-1.5 uppercase tracking-wider mb-4 border-b border-white/5 pb-3">
                 <div>&gt; Mostrando [{filteredItems.length}] servicios</div>
                 <div className="flex items-center gap-1.5 hidden sm:flex">
                    <HelpCircle className="w-3.5 h-3.5 text-teal-500/70" />
                    <span>Doble clic en un precio/estado para editar rápido</span>
                 </div>
              </div>

              <PricingTable
                items={filteredItems}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onInlineEdit={handleInlineEdit}
                onReorder={handleReorder}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
              />
            </div>
          )}
        </div>

        <div className="relative z-10">
           <TermsAndConditions />
        </div>
      </div>

      {/* Floating Bulk Actions Bar */}
      {selectedIds.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900/90 backdrop-blur-md border border-zinc-700 p-3 rounded-full shadow-2xl shadow-black flex items-center gap-4 z-40 animate-in slide-in-from-bottom-5">
              <span className="px-3 text-sm font-medium text-zinc-200 border-r border-zinc-700">
                  {selectedIds.length} seleccionados
              </span>
              <div className="flex items-center gap-2 px-1">
                 <button onClick={() => handleBulkStatusChange("activo")} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950 text-emerald-400 hover:bg-emerald-900 rounded-full text-xs font-medium transition-colors">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Activar
                 </button>
                 <button onClick={() => handleBulkStatusChange("inactivo")} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 rounded-full text-xs font-medium transition-colors">
                    <HelpCircle className="w-3.5 h-3.5" /> Desactivar
                 </button>
                  <button onClick={handleBulkDelete} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/50 text-red-400 hover:bg-red-900/60 rounded-full text-xs font-medium transition-colors ml-2">
                     <Trash2 className="w-3.5 h-3.5" /> Borrar
                  </button>
              </div>
          </div>
      )}

      {/* Modal */}
      <PricingFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        serviceConfig={editingItem}
      />
    </>
  );
}
