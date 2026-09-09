'use client';

import { useState, useEffect } from 'react';
import { 
  FolderTree, 
  Search, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  ChevronDown, 
  Layers, 
  ShieldCheck, 
  RefreshCw,
  Sparkles,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  getChartOfAccountsAction, 
  createPUCAccountAction, 
  togglePUCAccountAction 
} from '@/modules/accounting/actions/accounting';
import type { PUCTreeAccount } from '@/modules/accounting/types';

export function PucManagerModule() {
  const [accounts, setAccounts] = useState<PUCTreeAccount[]>([]);
  const [tree, setTree] = useState<PUCTreeAccount[]>([]);
  const [totalAccounts, setTotalAccounts] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    '1': true, '11': true, '1105': true, '2': true, '4': true, '5': true
  });

  // Modal new account state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newParentCode, setNewParentCode] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, [searchQuery]);

  const loadAccounts = async () => {
    setIsLoading(true);
    try {
      const res = await getChartOfAccountsAction(searchQuery);
      if (res.success) {
        setAccounts(res.accounts);
        setTree(res.tree);
        setTotalAccounts(res.totalAccounts);
      }
    } catch (e) {
      toast.error('Error al cargar el Plan de Cuentas');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (code: string) => {
    setExpandedNodes(prev => ({ ...prev, [code]: !prev[code] }));
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await togglePUCAccountAction(id, !currentActive);
      if (res.success) {
        toast.success(currentActive ? 'Cuenta inactivada' : 'Cuenta activada');
        loadAccounts();
      } else {
        toast.error(res.error || 'Error al actualizar estado');
      }
    } catch {
      toast.error('Error al comunicar con el servidor');
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newName) {
      toast.error('Código y nombre son obligatorios');
      return;
    }

    setIsSaving(true);
    try {
      const res = await createPUCAccountAction({
        code: newCode,
        name: newName,
        parentCode: newParentCode || undefined,
        description: newDescription || undefined,
      });

      if (res.success) {
        toast.success(`Cuenta ${newCode} registrada exitosamente`);
        setIsModalOpen(false);
        setNewCode('');
        setNewName('');
        setNewParentCode('');
        setNewDescription('');
        loadAccounts();
      } else {
        toast.error(res.error || 'Error al registrar cuenta');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al procesar solicitud');
    } finally {
      setIsSaving(false);
    }
  };

  const renderTreeItem = (node: PUCTreeAccount, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = !!expandedNodes[node.code];

    let levelLabel = 'Auxiliar';
    if (node.level === 1) levelLabel = 'Clase';
    else if (node.level === 2) levelLabel = 'Grupo';
    else if (node.level === 3) levelLabel = 'Cuenta';
    else if (node.level === 4) levelLabel = 'Subcuenta';

    let categoryColor = 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    if (node.category === 'PASIVO') categoryColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    else if (node.category === 'PATRIMONIO') categoryColor = 'text-purple-400 bg-purple-500/10 border-purple-500/20';
    else if (node.category === 'INGRESOS') categoryColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    else if (node.category === 'GASTOS') categoryColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    else if (node.category === 'COSTOS') categoryColor = 'text-orange-400 bg-orange-500/10 border-orange-500/20';

    return (
      <div key={node.id} className="flex flex-col">
        <div 
          className={`flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-900/60 transition-colors ${
            depth === 0 ? 'bg-slate-900/40 border border-slate-800/60 font-semibold mb-1' : ''
          }`}
          style={{ paddingLeft: `${Math.max(12, depth * 24)}px` }}
        >
          <div className="flex items-center gap-2 min-w-0">
            {hasChildren ? (
              <button 
                onClick={() => toggleExpand(node.code)} 
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
              >
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <div className="w-5" />
            )}

            <span className="font-mono text-xs font-bold text-teal-300">
              {node.code}
            </span>
            <span className="text-xs text-slate-200 truncate">
              {node.name}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border ${categoryColor}`}>
              {node.category}
            </span>
            <span className="text-[9px] font-mono text-slate-400 uppercase bg-slate-850 px-1.5 py-0.5 rounded border border-slate-800">
              {node.nature}
            </span>
            <span className="text-[9px] text-slate-500 font-sans">
              {levelLabel}
            </span>
            <button
              onClick={() => handleToggleActive(node.id, node.isActive)}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border cursor-pointer transition-colors ${
                node.isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30'
                  : 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-emerald-500/10 hover:text-emerald-400'
              }`}
              title="Clic para cambiar estado"
            >
              {node.isActive ? 'Activa' : 'Inactiva'}
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="flex flex-col">
            {node.children!.map(child => renderTreeItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/25 text-teal-400">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Plan Único de Cuentas (PUC Decreto 2650 & NIIF)
              <span className="text-xs font-mono font-normal text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
                {totalAccounts} Cuentas Registradas
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Estructura jerárquica de 6 niveles con validación automática de naturaleza y codificación oficial.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por código o nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 pl-8 pr-3 py-2 rounded-xl focus:border-teal-500 focus:outline-none w-56"
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-teal-500/10 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Nueva Cuenta Auxiliar
          </button>
        </div>
      </div>

      {/* Main Content: Tree View */}
      <div className="ds-card p-4 border-slate-800 bg-slate-950/70">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin text-teal-400" />
            <span className="text-xs">Cargando estructura contable del PUC...</span>
          </div>
        ) : tree.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No se encontraron cuentas con el criterio de búsqueda.
          </div>
        ) : (
          <div className="flex flex-col space-y-1">
            {tree.map(rootNode => renderTreeItem(rootNode, 0))}
          </div>
        )}
      </div>

      {/* Modal: Create Account */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-teal-400" />
                <h4 className="text-sm font-bold text-white">Registrar Nueva Cuenta Contable</h4>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Código PUC (ej. 11050501)</label>
                <input
                  type="text"
                  required
                  placeholder="11050501"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-teal-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  La categoría y naturaleza se asignan automáticamente según el primer dígito (Decreto 2650).
                </span>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Nombre de la Cuenta</label>
                <input
                  type="text"
                  required
                  placeholder="Caja Menor Sucursal Bogotá"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Código Cuenta Padre (Opcional)</label>
                <input
                  type="text"
                  placeholder="110505"
                  value={newParentCode}
                  onChange={(e) => setNewParentCode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Descripción / Observación (Opcional)</label>
                <textarea
                  placeholder="Fondo fijo para gastos menores de oficina..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl shadow-lg shadow-teal-500/20 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Guardando...' : 'Crear Cuenta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
