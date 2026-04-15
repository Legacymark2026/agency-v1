'use client';

import { useState, useEffect } from 'react';
import { Users, MailQuestion, ShieldAlert, Plus, RefreshCw, Trash2, MailMinus, ArrowLeft } from 'lucide-react';
import { getMailingLists, getSuppressionList, createMailingList, getListSubscribers } from '@/actions/mailing-list';
import { toast } from 'sonner';

export function AudienceManager() {
    const [tab, setTab] = useState<'lists' | 'suppression'>('lists');
    const [lists, setLists] = useState<any[]>([]);
    const [suppressed, setSuppressed] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newListMode, setNewListMode] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [selectedList, setSelectedList] = useState<any | null>(null);
    const [subscribers, setSubscribers] = useState<any[]>([]);
    const [loadingSubs, setLoadingSubs] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            if (tab === 'lists') {
                const res = await getMailingLists();
                setLists(res);
            } else {
                const res = await getSuppressionList();
                setSuppressed(res);
            }
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [tab]);

    const handleCreateList = async () => {
        if (!newListName.trim()) return;
        try {
            const result = await createMailingList(newListName.trim());
            if (!result.success) {
                toast.error(result.error || 'Error al crear la lista');
                return;
            }
            toast.success('Lista creada');
            setNewListName('');
            setNewListMode(false);
            loadData();
        } catch (err: any) {
            toast.error(err.message || 'Error inesperado');
        }
    };

    const handleViewList = async (list: any) => {
        setSelectedList(list);
        setLoadingSubs(true);
        try {
            const subs = await getListSubscribers(list.id);
            setSubscribers(subs);
        } catch (err: any) {
            toast.error('Error al cargar suscriptores');
        } finally {
            setLoadingSubs(false);
        }
    };

    if (selectedList) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
                    <button onClick={() => setSelectedList(null)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Users className="w-5 h-5 text-teal-500" /> {selectedList.name}
                        </h2>
                        <p className="text-sm text-slate-400">Gesti\u00f3n de suscriptores de la lista</p>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/40">
                    <div className="px-4 py-3 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
                        <h3 className="font-bold text-slate-200">Suscriptores ({selectedList._count?.subscribers || 0})</h3>
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-teal-500/20 text-teal-400 border border-teal-500/30 hover:bg-teal-500/30 rounded-lg text-sm font-bold transition-colors">
                            <Plus className="w-4 h-4" /> Importar / A\u00f1adir
                        </button>
                    </div>
                    {loadingSubs ? (
                        <div className="py-12 flex justify-center text-slate-500">
                            <RefreshCw className="w-6 h-6 animate-spin" />
                        </div>
                    ) : subscribers.length === 0 ? (
                         <div className="text-center py-12 text-slate-500">Lista sin suscriptores a\u00fan.</div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-900 text-slate-400 font-mono text-xs uppercase">
                                <tr>
                                    <th className="px-4 py-3 border-b border-slate-800">Email</th>
                                    <th className="px-4 py-3 border-b border-slate-800">Nombre</th>
                                    <th className="px-4 py-3 border-b border-slate-800">Estado</th>
                                    <th className="px-4 py-3 border-b border-slate-800">Fecha</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {subscribers.map(s => (
                                    <tr key={s.id} className="hover:bg-slate-800/30">
                                        <td className="px-4 py-3 text-slate-300 font-mono">{s.email}</td>
                                        <td className="px-4 py-3 text-slate-400">{s.name || '--'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-1 rounded font-bold ${s.status === 'SUBSCRIBED' ? 'bg-teal-500/10 text-teal-400' : 'bg-red-500/10 text-red-400'}`}>
                                                {s.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex gap-4 border-b border-slate-800 pb-4">
                <button
                    onClick={() => setTab('lists')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'lists' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'text-slate-400 hover:bg-slate-800/50'}`}
                >
                    <Users className="w-4 h-4" /> Listas de Audiencia
                </button>
                <button
                    onClick={() => setTab('suppression')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'suppression' ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'text-slate-400 hover:bg-slate-800/50'}`}
                >
                    <ShieldAlert className="w-4 h-4" /> Lista de Supresi\u00f3n
                </button>
            </div>

            {loading ? (
                <div className="py-12 flex justify-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
            ) : tab === 'lists' ? (
                <div className="space-y-4">
                    <div className="flex justify-between items-center bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                        <div>
                            <h3 className="text-white font-bold text-sm">Listas Maestradas</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Segmenta tus contactos para campa\u00f1as peri\u00f3dicas</p>
                        </div>
                        {newListMode ? (
                            <div className="flex gap-2">
                                <input type="text" value={newListName} onChange={e => setNewListName(e.target.value)} placeholder="Nombre de lista..." className="px-3 py-1.5 rounded-lg text-sm bg-slate-900 border border-slate-700 text-white outline-none focus:border-teal-500 transition-colors" autoFocus />
                                <button onClick={handleCreateList} className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-white rounded-lg text-sm font-bold transition-colors">Crear</button>
                                <button onClick={() => setNewListMode(false)} className="px-3 py-1.5 bg-slate-700 text-white hover:bg-slate-600 rounded-lg text-sm transition-colors">Cerrar</button>
                            </div>
                        ) : (
                            <button onClick={() => setNewListMode(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500/20 text-teal-400 border border-teal-500/30 hover:bg-teal-500/30 rounded-lg text-sm font-bold transition-all">
                                <Plus className="w-4 h-4" /> Nueva Lista
                            </button>
                        )}
                    </div>
                    {lists.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 border border-dashed border-slate-700 rounded-xl">No hay listas creadas.</div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {lists.map(l => (
                                <div key={l.id} onClick={() => handleViewList(l)} className="cursor-pointer group p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-teal-500/50 hover:bg-slate-800 transition-all">
                                    <div className="flex items-start justify-between">
                                        <h4 className="font-bold text-slate-200 group-hover:text-teal-400 transition-colors">{l.name}</h4>
                                        <Users className="w-4 h-4 text-teal-500/50 group-hover:text-teal-400 transition-colors" />
                                    </div>
                                    <p className="text-3xl font-black text-white mt-3">{l._count?.subscribers || 0}</p>
                                    <p className="text-xs text-slate-500 mt-1">suscriptores</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                        <h3 className="text-red-400 font-bold text-sm flex items-center gap-2"><MailMinus className="w-4 h-4" /> Bajas, Quejas y Rebotes</h3>
                        <p className="text-xs text-slate-400 mt-1">Estos correos ser\u00e1n omitidos autom\u00e1ticamente de cualquier env\u00edo de la cuenta.</p>
                    </div>
                    <div className="rounded-xl border border-slate-800 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-900 text-slate-400 font-mono text-xs uppercase">
                                <tr>
                                    <th className="px-4 py-3 border-b border-slate-800">Email</th>
                                    <th className="px-4 py-3 border-b border-slate-800">Motivo</th>
                                    <th className="px-4 py-3 border-b border-slate-800">Fecha</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 bg-slate-900/30">
                                {suppressed.length === 0 ? (
                                    <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-500">La lista de supresi\u00f3n est\u00e1 vac\u00eda.</td></tr>
                                ) : suppressed.map(s => (
                                    <tr key={s.id} className="hover:bg-slate-800/30">
                                        <td className="px-4 py-3 text-slate-300 font-mono">{s.email}</td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-400">{s.reason}</span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

