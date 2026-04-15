'use client';

import { useState, useMemo } from 'react';
import { Mail, Plus, Send, CheckCircle, XCircle, Clock, BarChart2, Trash2, X, Eye, RotateCcw, AlertTriangle, Copy, Download, Search, Filter, Users } from 'lucide-react';
import { EmailBlastWizard } from './EmailBlastWizard';
import { deleteEmailBlast, deleteEmailBlasts, getEmailBlastStats, cloneEmailBlast, retryFailedEmailBlast } from '@/actions/email-blast';
import { toast } from 'sonner';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────

type BlastSummary = {
    id: string;
    name: string;
    subject: string;
    status: string;
    totalRecipients: number;
    sent: number;
    failed: number;
    sentAt: Date | null;
    createdAt: Date;
    creatorName: string;
};

type Recipient = {
    email: string;
    name: string | null;
    status: string;
    errorMessage: string | null;
    sentAt: Date | null;
};

type BlastDetail = {
    id: string;
    name: string;
    subject: string;
    status: string;
    fromName: string;
    fromEmail: string;
    htmlBody: string;
    totalRecipients: number;
    sent: number;
    failed: number;
    recipients: Recipient[];
};

// ─── Status config ────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: typeof CheckCircle }> = {
    DRAFT: { label: 'Borrador', color: '#94a3b8', bg: 'rgba(30,41,59,0.6)', Icon: Clock },
    SENDING: { label: 'Enviando', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', Icon: Send },
    COMPLETED: { label: 'Completado', color: '#2dd4bf', bg: 'rgba(13,148,136,0.1)', Icon: CheckCircle },
    FAILED: { label: 'Fallido', color: '#f87171', bg: 'rgba(239,68,68,0.1)', Icon: XCircle },
};

const RECIPIENT_STATUS: Record<string, { label: string; color: string; dotColor: string }> = {
    PENDING: { label: 'Pendiente', color: '#94a3b8', dotColor: '#64748b' },
    SENT: { label: 'Enviado', color: '#2dd4bf', dotColor: '#0d9488' },
    FAILED: { label: 'Fallido', color: '#f87171', dotColor: '#ef4444' },
};

// ─── CSV Export helper ────────────────────────────────────────────────────

function exportDetailCSV(detail: BlastDetail) {
    const headers = ['Email', 'Nombre', 'Estado', 'Enviado a las', 'Error'];
    const rows = detail.recipients.map((r) => [
        r.email,
        r.name ?? '',
        RECIPIENT_STATUS[r.status]?.label ?? r.status,
        r.sentAt ? new Date(r.sentAt).toLocaleString('es-CO') : '',
        r.errorMessage ?? '',
    ]);
    const csvContent = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_${detail.name.replace(/\s+/g, '_').toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ─── Detail Modal ─────────────────────────────────────────────────────────

function DetailModal({ detail, onClose, onResend }: { detail: BlastDetail; onClose: () => void; onResend: () => void }) {
    const [filter, setFilter] = useState<'ALL' | 'SENT' | 'FAILED'>('ALL');
    const sentCount = detail.recipients.filter(r => r.status === 'SENT').length;
    const failedCount = detail.recipients.filter(r => r.status === 'FAILED').length;
    const pendingCount = detail.recipients.filter(r => r.status === 'PENDING').length;
    const rate = detail.recipients.length > 0 ? Math.round((sentCount / detail.recipients.length) * 100) : 0;

    const filtered = detail.recipients.filter(r => filter === 'ALL' || r.status === filter);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(2,6,23,0.9)', backdropFilter: 'blur(8px)' }}>
            <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl" style={{ background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(30,41,59,0.8)' }}>
                {/* Header */}
                <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid rgba(30,41,59,0.6)' }}>
                    <div>
                        <h2 className="text-lg font-black text-white">{detail.name}</h2>
                        <p className="text-sm text-slate-500 mt-0.5">{detail.subject}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Export CSV */}
                        <button
                            onClick={() => exportDetailCSV(detail)}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-violet-400 transition-all hover:text-white"
                            style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}
                            title="Descargar reporte CSV"
                        >
                            <Download className="w-4 h-4" />
                            Exportar
                        </button>
                        {(failedCount > 0 || pendingCount > 0) && (
                        <button
                            onClick={onResend}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-amber-400 transition-all hover:text-white"
                            style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}
                        >
                            <RotateCcw className="w-4 h-4" />
                            Reintentar envíos ({failedCount > 0 ? failedCount : pendingCount})
                        </button>
                        )}
                        <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-4 gap-3 p-6" style={{ borderBottom: '1px solid rgba(30,41,59,0.4)' }}>
                    {[
                        { label: 'Total', value: detail.recipients.length, color: '#94a3b8' },
                        { label: 'Enviados', value: sentCount, color: '#2dd4bf' },
                        { label: 'Fallidos', value: failedCount, color: failedCount > 0 ? '#f87171' : '#475569' },
                        { label: 'Tasa de éxito', value: `${rate}%`, color: '#818cf8' },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="rounded-xl p-3 text-center" style={{ background: 'rgba(2,6,23,0.6)', border: '1px solid rgba(30,41,59,0.6)' }}>
                            <p className="text-2xl font-black" style={{ color }}>{value}</p>
                            <p className="text-xs text-slate-600 mt-0.5">{label}</p>
                        </div>
                    ))}
                </div>

                {/* Filter tabs */}
                <div className="flex gap-2 px-6 py-3" style={{ borderBottom: '1px solid rgba(30,41,59,0.4)' }}>
                    {(['ALL', 'SENT', 'FAILED'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
                            style={{
                                background: filter === f ? 'rgba(13,148,136,0.15)' : 'rgba(30,41,59,0.4)',
                                border: filter === f ? '1px solid rgba(13,148,136,0.4)' : '1px solid rgba(30,41,59,0.6)',
                                color: filter === f ? '#2dd4bf' : '#64748b',
                            }}
                        >
                            {f === 'ALL' ? `Todos (${detail.recipients.length})` :
                                f === 'SENT' ? `Enviados (${sentCount})` :
                                    `Fallidos (${failedCount})`}
                        </button>
                    ))}
                </div>

                {/* Recipients list */}
                <div className="flex-1 overflow-y-auto">
                    {filtered.length === 0 ? (
                        <div className="text-center py-12 text-slate-600 text-sm">Sin resultados</div>
                    ) : (
                        filtered.map((r, i) => {
                            const rs = RECIPIENT_STATUS[r.status] ?? RECIPIENT_STATUS.PENDING;
                            return (
                                <div
                                    key={i}
                                    className="flex items-center gap-4 px-6 py-3"
                                    style={{ borderBottom: '1px solid rgba(30,41,59,0.2)' }}
                                >
                                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: rs.dotColor }} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white truncate">{r.name || '—'}</p>
                                        <p className="text-xs text-slate-500 font-mono truncate">{r.email}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-bold" style={{ color: rs.color }}>{rs.label}</span>
                                        {r.errorMessage && (
                                            <p className="text-xs text-red-400 mt-0.5 max-w-[200px] truncate" title={r.errorMessage}>
                                                {r.errorMessage}
                                            </p>
                                        )}
                                        {r.sentAt && (
                                            <p className="text-xs text-slate-600 mt-0.5">
                                                {new Date(r.sentAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────

export function EmailBlastDashboard({ initialBlasts }: { initialBlasts: BlastSummary[] }) {
    const [blasts, setBlasts] = useState(initialBlasts);
    const [showWizard, setShowWizard] = useState(false);
    const [detail, setDetail] = useState<BlastDetail | null>(null);
    const [loadingDetail, setLoadingDetail] = useState<string | null>(null);
    const [selectedBlasts, setSelectedBlasts] = useState<string[]>([]);

    // ── Search & Filter state ──
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'SENDING' | 'COMPLETED' | 'FAILED'>('ALL');

    const handleDone = () => {
        setShowWizard(false);
        window.location.reload();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar esta campaña?')) return;
        await deleteEmailBlast(id);
        setBlasts((b) => b.filter((x) => x.id !== id));
        setSelectedBlasts((s) => s.filter((x) => x !== id));
        toast.success('Campaña eliminada');
    };

    const handleBulkDelete = async () => {
        if (!confirm(`¿Eliminar ${selectedBlasts.length} campañas seleccionadas?`)) return;
        try {
            await deleteEmailBlasts(selectedBlasts);
            setBlasts((b) => b.filter((x) => !selectedBlasts.includes(x.id)));
            setSelectedBlasts([]);
            toast.success('Campañas eliminadas');
        } catch {
            toast.error('Error al eliminar campañas');
        }
    };

    const handleClone = async (id: string) => {
        const toastId = toast.loading('Clonando campaña…');
        try {
            const clone = await cloneEmailBlast(id);
            // Refresh list — simplest approach
            window.location.reload();
            toast.success('Campaña clonada como borrador', { id: toastId });
        } catch {
            toast.error('Error al clonar campaña', { id: toastId });
        }
    };

    const toggleSelectAll = () => {
        if (selectedBlasts.length === filteredBlasts.length && filteredBlasts.length > 0) {
            setSelectedBlasts([]);
        } else {
            setSelectedBlasts(filteredBlasts.map(b => b.id));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedBlasts(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleViewDetail = async (blast: BlastSummary) => {
        setLoadingDetail(blast.id);
        try {
            const data = await getEmailBlastStats(blast.id);
            setDetail(data as BlastDetail);
        } catch {
            toast.error('Error al cargar el detalle');
        } finally {
            setLoadingDetail(null);
        }
    };

    // ── Filtered & searched blasts ──
    const filteredBlasts = useMemo(() => {
        return blasts.filter((b) => {
            const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
            const query = searchQuery.toLowerCase();
            const matchesSearch =
                !query ||
                b.name.toLowerCase().includes(query) ||
                b.subject.toLowerCase().includes(query) ||
                b.creatorName.toLowerCase().includes(query);
            return matchesStatus && matchesSearch;
        });
    }, [blasts, searchQuery, statusFilter]);

    const totalSent = blasts.reduce((a, b) => a + b.sent, 0);
    const totalFailed = blasts.reduce((a, b) => a + b.failed, 0);
    const totalRecipients = blasts.reduce((a, b) => a + b.totalRecipients, 0);
    const avgRate = totalRecipients > 0 ? Math.round((totalSent / totalRecipients) * 100) : 0;

    return (
        <div className="min-h-screen p-6 lg:p-8" style={{ background: '#020617' }}>
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,rgba(13,148,136,0.2),rgba(8,145,178,0.2))', border: '1px solid rgba(13,148,136,0.3)' }}>
                            <Mail className="w-5 h-5 text-teal-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight">Email Masivo</h1>
                            <p className="text-slate-500 text-sm">Sube tu base de datos y envía campañas personalizadas</p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        {selectedBlasts.length > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-red-500 hover:bg-red-500/10 transition-colors border border-red-500/20"
                            >
                                <Trash2 className="w-4 h-4" />
                                Eliminar ({selectedBlasts.length})
                            </button>
                        )}
                        <Link href="/dashboard/marketing/email-blast/audience">
                            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-slate-300 transition-all hover:bg-slate-800 border border-slate-700">
                                <Users className="w-4 h-4" />
                                Gestor de Audiencias
                            </button>
                        </Link>
                        <button
                            onClick={() => setShowWizard(true)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white transition-all hover:scale-105"
                            style={{ background: 'linear-gradient(135deg,#0d9488,#0891b2)' }}
                        >
                            <Plus className="w-4 h-4" />
                            Nueva campaña
                        </button>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Campañas', value: blasts.length, icon: Mail, color: '#2dd4bf' },
                    { label: 'Total enviados', value: totalSent, icon: Send, color: '#34d399' },
                    { label: 'Fallidos', value: totalFailed, icon: XCircle, color: '#f87171' },
                    { label: 'Tasa de éxito', value: `${avgRate}%`, icon: BarChart2, color: '#818cf8' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="rounded-2xl p-5" style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(30,41,59,0.6)' }}>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</span>
                            <Icon className="w-4 h-4" style={{ color }} />
                        </div>
                        <p className="text-3xl font-black" style={{ color }}>{value}</p>
                    </div>
                ))}
            </div>

            {/* Search & Filter Bar */}
            {blasts.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    {/* Search */}
                    <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(30,41,59,0.6)' }}>
                        <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, asunto o creador..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 outline-none"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="text-slate-500 hover:text-white transition-colors">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    {/* Status filter */}
                    <div className="flex items-center gap-1.5 p-1 rounded-xl" style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(30,41,59,0.6)' }}>
                        <Filter className="w-3.5 h-3.5 text-slate-600 ml-2" />
                        {(['ALL', 'DRAFT', 'SENDING', 'COMPLETED', 'FAILED'] as const).map((s) => {
                            const cfg = s === 'ALL' ? { label: 'Todos', color: '#94a3b8' } : STATUS_CONFIG[s];
                            const isActive = statusFilter === s;
                            return (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                                    style={{
                                        background: isActive ? (s === 'ALL' ? 'rgba(30,41,59,0.8)' : STATUS_CONFIG[s]?.bg ?? 'rgba(30,41,59,0.8)') : 'transparent',
                                        color: isActive ? (s === 'ALL' ? '#e2e8f0' : (STATUS_CONFIG[s]?.color ?? '#94a3b8')) : '#475569',
                                    }}
                                >
                                    {s === 'ALL' ? 'Todos' : STATUS_CONFIG[s]?.label ?? s}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Blast list */}
            {blasts.length === 0 ? (
                <div className="text-center py-24">
                    <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(30,41,59,0.8)' }}>
                        <Mail className="w-8 h-8 text-slate-600" />
                    </div>
                    <p className="text-slate-400 font-bold text-lg mb-2">Sin campañas todavía</p>
                    <p className="text-slate-600 text-sm mb-6">Crea tu primera campaña de email masivo</p>
                    <button
                        onClick={() => setShowWizard(true)}
                        className="px-6 py-3 rounded-xl text-sm font-black text-white"
                        style={{ background: 'linear-gradient(135deg,#0d9488,#0891b2)' }}
                    >
                        Crear primera campaña
                    </button>
                </div>
            ) : filteredBlasts.length === 0 ? (
                <div className="text-center py-16 rounded-2xl" style={{ border: '1px solid rgba(30,41,59,0.4)', background: 'rgba(15,23,42,0.4)' }}>
                    <Search className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 font-bold">Sin resultados</p>
                    <p className="text-slate-600 text-sm mt-1">Prueba con otro término o limpia los filtros</p>
                    <button onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }} className="mt-4 text-sm text-teal-400 hover:text-teal-300 transition-colors">
                        Limpiar filtros
                    </button>
                </div>
            ) : (
                <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(30,41,59,0.6)' }}>
                    <div className="px-6 py-4 flex items-center gap-4" style={{ background: 'rgba(15,23,42,0.8)', borderBottom: '1px solid rgba(30,41,59,0.6)' }}>
                        <input
                            type="checkbox"
                            checked={filteredBlasts.length > 0 && selectedBlasts.length === filteredBlasts.length}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-teal-500 focus:ring-teal-500 focus:ring-offset-slate-900 cursor-pointer"
                        />
                        <span className="text-sm font-black text-white">
                            Historial de campañas
                            {filteredBlasts.length !== blasts.length && (
                                <span className="ml-2 text-slate-500 font-normal">{filteredBlasts.length} de {blasts.length}</span>
                            )}
                        </span>
                    </div>
                    <div style={{ background: 'rgba(2,6,23,0.6)' }}>
                        {filteredBlasts.map((blast) => {
                            const cfg = STATUS_CONFIG[blast.status] ?? STATUS_CONFIG.DRAFT;
                            const Icon = cfg.Icon;
                            const rate = blast.totalRecipients > 0 ? Math.round((blast.sent / blast.totalRecipients) * 100) : 0;
                            const isLoading = loadingDetail === blast.id;
                            const isSelected = selectedBlasts.includes(blast.id);

                            const dateStr = new Date(blast.createdAt).toLocaleString('es-CO', {
                                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            });

                            return (
                                <div
                                    key={blast.id}
                                    className={`px-6 py-4 flex items-center gap-4 transition-colors hover:bg-slate-900/40 ${isSelected ? 'bg-slate-900/60' : ''}`}
                                    style={{ borderBottom: '1px solid rgba(30,41,59,0.3)' }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => toggleSelect(blast.id)}
                                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-teal-500 focus:ring-teal-500 focus:ring-offset-slate-900 cursor-pointer"
                                    />
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg, border: `1px solid ${cfg.color}33` }}>
                                        <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white truncate">{blast.name}</p>
                                        <p className="text-xs text-slate-500 truncate flex items-center gap-2">
                                            <span>{blast.subject}</span>
                                            <span className="opacity-50">•</span>
                                            <span>Por {blast.creatorName}</span>
                                            <span className="opacity-50">•</span>
                                            <span>{dateStr}</span>
                                        </p>
                                    </div>

                                    {/* Stats */}
                                    <div className="hidden md:flex items-center gap-6">
                                        <div className="text-center">
                                            <p className="text-sm font-black text-white">{blast.totalRecipients}</p>
                                            <p className="text-xs text-slate-600">Total</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-black text-teal-400">{blast.sent}</p>
                                            <p className="text-xs text-slate-600">Enviados</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-black" style={{ color: blast.failed > 0 ? '#f87171' : '#475569' }}>{blast.failed}</p>
                                            <p className="text-xs text-slate-600">Fallidos</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-black text-violet-400">{rate}%</p>
                                            <p className="text-xs text-slate-600">Tasa</p>
                                        </div>
                                    </div>

                                    {/* Status badge */}
                                    <div className="px-2.5 py-1 rounded-lg text-xs font-bold" style={{ background: cfg.bg, color: cfg.color }}>
                                        {cfg.label}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1">
                                        {/* View detail */}
                                        <button
                                            onClick={() => handleViewDetail(blast)}
                                            disabled={isLoading}
                                            className="p-1.5 rounded-lg text-slate-500 hover:text-teal-400 transition-colors"
                                            title="Ver detalle de envíos"
                                        >
                                            {isLoading ? (
                                                <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Eye className="w-4 h-4" />
                                            )}
                                        </button>
                                        {/* Clone */}
                                        <button
                                            onClick={() => handleClone(blast.id)}
                                            className="p-1.5 rounded-lg text-slate-500 hover:text-violet-400 transition-colors"
                                            title="Duplicar campaña como borrador"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                        {/* Warning if has failures */}
                                        {blast.failed > 0 && (
                                            <button
                                                onClick={() => handleViewDetail(blast)}
                                                className="p-1.5 rounded-lg text-amber-500 hover:text-amber-400 transition-colors"
                                                title={`${blast.failed} envíos fallidos — Click para ver`}
                                            >
                                                <AlertTriangle className="w-4 h-4" />
                                            </button>
                                        )}
                                        {/* Delete */}
                                        <button
                                            onClick={() => handleDelete(blast.id)}
                                            className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 transition-colors"
                                            title="Eliminar campaña"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {detail && (
                <DetailModal
                    detail={detail}
                    onClose={() => setDetail(null)}
                    onResend={async () => {
                        const toastId = toast.loading('Re-encolando campaña...');
                        try {
                            const result = await retryFailedEmailBlast(detail.id);
                            toast.success(result.message, { id: toastId });
                            setDetail(null);
                            // Refresh list
                            window.location.reload();
                        } catch (err: any) {
                            toast.error(err.message || 'Error al reintentar', { id: toastId });
                        }
                    }}
                />
            )}

            {/* Wizard Modal */}
            {showWizard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(8px)' }}>
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl" style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(30,41,59,0.8)' }}>
                        <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid rgba(30,41,59,0.6)' }}>
                            <div>
                                <h2 className="text-lg font-black text-white">Nueva campaña de email</h2>
                                <p className="text-sm text-slate-500">Sube tu CSV y personaliza el envío</p>
                            </div>
                            <button onClick={() => setShowWizard(false)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <EmailBlastWizard onDone={handleDone} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
