'use client';

import React, { useState } from 'react';
import { 
    Search, RefreshCw, AlertTriangle, CheckCircle2, XCircle, 
    ExternalLink, Globe, Play, ArrowRight, Lock, Settings, 
    Activity, Wifi, FileText, Database, ShieldCheck, CornerDownRight, Check
} from 'lucide-react';
import { inspectUrlsAction, inspectSingleUrlAction, GSCReport, GSCResult } from "@/actions/seo";
import Link from 'next/link';

interface SeoDashboardClientProps {
    initialCredsStatus: { configured: boolean; clientId?: string; error?: string };
    initialReport: GSCReport | null;
    sitemapUrls: string[];
}

export function SeoDashboardClient({ initialCredsStatus, initialReport, sitemapUrls }: SeoDashboardClientProps) {
    const [report, setReport] = useState<GSCReport | null>(initialReport);
    const [credsStatus] = useState(initialCredsStatus);
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [verdictFilter, setVerdictFilter] = useState('ALL');
    const [batchSize, setBatchSize] = useState(6);
    
    // Single URL inspection state
    const [singleUrlInput, setSingleUrlInput] = useState('');
    const [isInspectingSingle, setIsInspectingSingle] = useState(false);
    const [singleResult, setSingleResult] = useState<GSCResult | null>(null);

    // Copy to clipboard helper
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 1500);
    };

    // Calculate metrics
    const results = report?.results || [];
    const totalSitemapCount = sitemapUrls.length;
    const auditedCount = results.length;
    const indexedCount = results.filter(r => r.verdict === 'PASS').length;
    const indexationRate = auditedCount > 0 ? Math.round((indexedCount / auditedCount) * 100) : 0;
    
    const errorsList = results.filter(r => typeof r.httpStatus === 'number' ? r.httpStatus !== 200 : r.httpStatus.toString().includes('ERROR'));
    const unindexedList = results.filter(r => r.verdict !== 'PASS' && r.verdict !== 'ERROR');

    // Run batch scan
    const handleBatchScan = async () => {
        if (isScanning) return;
        setIsScanning(true);
        setSingleResult(null);
        
        try {
            setScanProgress('Filtrando URLs del sitemap...');
            // Sample main routes and some blog posts
            const mainUrls = sitemapUrls.filter(u => !u.includes('/blog/')).slice(0, Math.ceil(batchSize / 2));
            const blogUrls = sitemapUrls.filter(u => u.includes('/blog/')).slice(0, Math.floor(batchSize / 2));
            const urlsToScan = [...mainUrls, ...blogUrls].slice(0, batchSize);

            if (urlsToScan.length === 0) {
                // fallback to first N urls
                urlsToScan.push(...sitemapUrls.slice(0, batchSize));
            }

            setScanProgress(`Iniciando inspección de ${urlsToScan.length} URLs seleccionadas...`);
            
            const freshReport = await inspectUrlsAction(urlsToScan);
            setReport(freshReport);
            setScanProgress('¡Completado con éxito!');
        } catch (e: any) {
            console.error(e);
            alert(`Error al escanear URLs: ${e.message}`);
        } finally {
            setTimeout(() => {
                setIsScanning(false);
                setScanProgress('');
            }, 1000);
        }
    };

    // Inspect individual URL
    const handleSingleInspect = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!singleUrlInput || isInspectingSingle) return;

        let targetUrl = singleUrlInput.trim();
        // Basic validation & autofill protocol
        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            targetUrl = `https://${targetUrl}`;
        }

        setIsInspectingSingle(true);
        setSingleResult(null);

        try {
            const result = await inspectSingleUrlAction(targetUrl);
            setSingleResult(result);
            
            // Reload report to pull in updated cache
            const freshReport = await inspectUrlsAction([]); // Just reads/updates cache if empty
            if (freshReport && freshReport.results.length > 0) {
                setReport(freshReport);
            }
        } catch (e: any) {
            console.error(e);
            alert(`Error al inspeccionar URL: ${e.message}`);
        } finally {
            setIsInspectingSingle(false);
        }
    };

    // Filter results
    const filteredResults = results.filter(r => {
        const matchesSearch = r.url.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesVerdict = verdictFilter === 'ALL' || 
            (verdictFilter === 'PASS' && r.verdict === 'PASS') ||
            (verdictFilter === 'NEUTRAL' && r.verdict === 'NEUTRAL') ||
            (verdictFilter === 'FAIL' && (r.verdict === 'FAIL' || r.verdict === 'ERROR'));
        return matchesSearch && matchesVerdict;
    });

    // Setup guide for missing credentials
    if (!credsStatus.configured) {
        return (
            <div className="min-h-[calc(100vh-80px)] flex flex-col p-6 relative bg-transparent">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02] pointer-events-none mix-blend-screen" />
                
                {/* Header */}
                <div className="relative z-10 flex items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-800">
                    <div className="flex items-center gap-4">
                        <div className="ds-icon-box w-12 h-12 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-center">
                            <Wifi className="w-5 h-5 text-teal-400 animate-pulse" />
                        </div>
                        <div>
                            <h1 className="ds-heading-page text-2xl font-bold tracking-tight text-white">Monitor SEO de Indexación</h1>
                            <p className="ds-subtext text-sm text-slate-400">Verifica el estado de tus páginas en Google Search Console en tiempo real</p>
                        </div>
                    </div>
                    <span className="ds-badge border-red-500/20 text-red-400 bg-red-500/5 px-3 py-1 rounded-full text-xs font-mono">
                        [GSC_OAUTH_SETUP_PENDING]
                    </span>
                </div>

                {/* Instructions card */}
                <div className="max-w-2xl mx-auto w-full relative z-10">
                    <div className="ds-card p-8 bg-slate-900/50 border border-slate-800 rounded-2xl backdrop-blur-md shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500 via-teal-500 to-transparent" />
                        
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                                <Lock size={18} />
                            </div>
                            <h2 className="text-xl font-bold text-white tracking-wide">Configuración de Credenciales Requerida</h2>
                        </div>

                        <p className="text-slate-300 text-sm leading-relaxed mb-6">
                            El archivo de credenciales de Google Search Console <code className="text-teal-400 font-mono bg-teal-500/5 px-1.5 py-0.5 rounded border border-teal-500/10">gsc-credentials.json</code> no se encuentra configurado en el servidor. Para activar el monitor en tiempo real y conectarte a la API de Google, debes completar el flujo OAuth 2.0.
                        </p>

                        <div className="space-y-4 text-sm bg-black/40 border border-slate-800/80 p-5 rounded-xl font-mono text-slate-300 mb-8">
                            <p className="text-slate-400 font-sans font-bold text-xs uppercase tracking-wider mb-2">Pasos para autorizar:</p>
                            <div className="flex items-start gap-3">
                                <span className="text-teal-400 font-bold shrink-0">1.</span>
                                <span>Abre una terminal en la raíz del proyecto.</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-teal-400 font-bold shrink-0">2.</span>
                                <span>Ejecuta el script de autorización:
                                    <pre className="mt-2 p-2.5 rounded bg-slate-950 text-teal-300 border border-slate-800 text-xs overflow-x-auto select-all">node gsc-authorize.js</pre>
                                </span>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-teal-400 font-bold shrink-0">3.</span>
                                <span>Ingresa el ID y Secreto de Cliente OAuth que creaste en la consola de Google.</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-teal-400 font-bold shrink-0">4.</span>
                                <span>Abre el link de Google generado, autoriza la cuenta propietaria del dominio y copia la URL de redirección final en la consola.</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 justify-between pt-4 border-t border-slate-800">
                            <span className="text-xs font-mono text-slate-500">Error detectado: {credsStatus.error || "Archivo no encontrado"}</span>
                            <button 
                                onClick={() => window.location.reload()}
                                className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-md shadow-teal-500/10 active:scale-95"
                            >
                                <RefreshCw size={12} className="animate-spin-hover" />
                                Reintentar Conexión
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-80px)] flex flex-col p-6 relative bg-transparent space-y-6">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.025] pointer-events-none mix-blend-screen" />
            
            {/* ── Header ── */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
                <div className="flex items-center gap-4">
                    <div className="ds-icon-box w-12 h-12 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-center">
                        <Wifi className="w-5 h-5 text-teal-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="ds-badge border-teal-500/20 text-teal-400 bg-teal-500/5 px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider">
                                SEO_GSC · LIVE MONITOR
                            </span>
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
                            </span>
                        </div>
                        <h1 className="ds-heading-page text-2xl font-bold tracking-tight text-white">Monitor SEO de Indexación</h1>
                        <p className="ds-subtext text-xs text-slate-400">Estado de páginas del Sitemap en Google Search Console e HTTP Live</p>
                    </div>
                </div>
                
                {/* Batch Scanner Options */}
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2 p-1 bg-slate-900/60 border border-slate-800 rounded-lg">
                        <span className="text-[10px] uppercase font-mono text-slate-500 px-2">Lote:</span>
                        {[6, 12, 20].map(sz => (
                            <button
                                key={sz}
                                onClick={() => setBatchSize(sz)}
                                className={`px-2.5 py-1 text-xs font-mono rounded ${batchSize === sz ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'text-slate-400 hover:text-white'}`}
                                disabled={isScanning}
                            >
                                {sz}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleBatchScan}
                        disabled={isScanning}
                        className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white disabled:bg-slate-800 disabled:text-slate-500 border border-teal-500/30 disabled:border-slate-800 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-md shadow-teal-500/10 active:scale-95 shrink-0"
                    >
                        {isScanning ? (
                            <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-400" />
                                <span>Escaneando...</span>
                            </>
                        ) : (
                            <>
                                <Play className="w-3.5 h-3.5 text-teal-300" />
                                <span>Escanear Muestra</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Scanning Progress Log */}
            {isScanning && (
                <div className="relative z-10 p-3 bg-teal-500/5 border border-teal-500/20 rounded-xl flex items-center gap-3 font-mono text-xs text-teal-400 animate-pulse">
                    <Activity size={14} className="animate-pulse" />
                    <span>Progreso: {scanProgress}</span>
                </div>
            )}

            {/* ── Executive HUD Widgets ── */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Widget 1: Indexation Rate */}
                <div className="ds-card p-5 bg-slate-900/40 border border-slate-800/80 rounded-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-slate-400 group-hover:opacity-10 transition-opacity">
                        <CheckCircle2 size={48} />
                    </div>
                    <p className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tasa de Indexación</p>
                    <div className="flex items-baseline gap-2 mt-2">
                        <h2 className="text-3xl font-extrabold text-white tracking-tight">{indexationRate}%</h2>
                        <span className="text-xs text-slate-400 font-mono">({indexedCount}/{auditedCount} auditadas)</span>
                    </div>
                    {/* Tiny progress bar */}
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
                        <div 
                            className="bg-teal-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${indexationRate}%` }}
                        />
                    </div>
                </div>

                {/* Widget 2: Sitemap Coverage */}
                <div className="ds-card p-5 bg-slate-900/40 border border-slate-800/80 rounded-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-slate-400 group-hover:opacity-10 transition-opacity">
                        <Globe size={48} />
                    </div>
                    <p className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cobertura Sitemap</p>
                    <div className="flex items-baseline gap-2 mt-2">
                        <h2 className="text-3xl font-extrabold text-white tracking-tight">
                            {auditedCount > 0 ? Math.round((auditedCount / totalSitemapCount) * 100) : 0}%
                        </h2>
                        <span className="text-xs text-slate-400 font-mono">({auditedCount} de {totalSitemapCount} URLs)</span>
                    </div>
                    {/* Status marker */}
                    <p className="text-[10px] font-mono text-slate-500 mt-5">Sitemap Live: legacymarksas.com/sitemap.xml</p>
                </div>

                {/* Widget 3: Healthy URLs */}
                <div className="ds-card p-5 bg-slate-900/40 border border-slate-800/80 rounded-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-slate-400 group-hover:opacity-10 transition-opacity">
                        <ShieldCheck size={48} />
                    </div>
                    <p className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-widest">Salud de Red (HTTP 200)</p>
                    <div className="flex items-baseline gap-2 mt-2">
                        <h2 className="text-3xl font-extrabold text-white tracking-tight">
                            {auditedCount > 0 ? auditedCount - errorsList.length : 0}
                        </h2>
                        <span className="text-xs text-slate-400 font-mono">de {auditedCount} correctas</span>
                    </div>
                    <p className="text-[10px] font-mono text-slate-500 mt-5">
                        {errorsList.length > 0 ? `⚠️ ${errorsList.length} caídas críticas detectadas` : '✅ Todos los canales operativos'}
                    </p>
                </div>

                {/* Widget 4: Last Audit Run */}
                <div className="ds-card p-5 bg-slate-900/40 border border-slate-800/80 rounded-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-slate-400 group-hover:opacity-10 transition-opacity">
                        <Database size={48} />
                    </div>
                    <p className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-widest">Última Auditoría GSC</p>
                    <div className="flex flex-col mt-2">
                        <h2 className="text-lg font-bold text-slate-100 tracking-tight mt-1 truncate">
                            {report?.timestamp ? new Date(report.timestamp).toLocaleDateString() : 'Ninguna'}
                        </h2>
                        <span className="text-xs text-slate-400 font-mono">
                            {report?.timestamp ? new Date(report.timestamp).toLocaleTimeString() : 'Ejecutar escaneo para iniciar'}
                        </span>
                    </div>
                    <p className="text-[10px] font-mono text-slate-500 mt-4 truncate">
                        ID GSC: sc-domain:legacymarksas.com
                    </p>
                </div>
            </div>

            {/* ── Single URL Inspector Panel ── */}
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Form to Inspect Custom URL */}
                <div className="ds-card p-6 bg-slate-900/40 border border-slate-800/80 rounded-xl h-fit lg:col-span-1">
                    <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-4 h-4 text-teal-400" />
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Inspección de URL Única</h3>
                    </div>
                    
                    <form onSubmit={handleSingleInspect} className="space-y-4">
                        <p className="text-slate-400 text-xs leading-relaxed">
                            Ingresa una URL específica de tu propiedad para auditar su veredicto de indexación y cobertura en GSC.
                        </p>
                        
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="ej. legacymarksas.com/es/servicios"
                                value={singleUrlInput}
                                onChange={(e) => setSingleUrlInput(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-850 hover:border-slate-700 focus:border-teal-500/50 text-white rounded-lg pl-3 pr-10 py-2.5 text-xs font-mono focus:outline-none transition-all"
                                disabled={isInspectingSingle}
                            />
                            <button
                                type="submit"
                                disabled={isInspectingSingle || !singleUrlInput}
                                className="absolute right-1.5 top-1.5 p-1 bg-slate-900 border border-slate-850 text-teal-400 hover:text-teal-300 disabled:text-slate-600 rounded-md transition-all"
                            >
                                {isInspectingSingle ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Play className="w-3.5 h-3.5" />
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Single Inspect Result Display */}
                    {singleResult && (
                        <div className="mt-5 p-4 rounded-lg bg-black/40 border border-slate-850 space-y-3 text-xs font-mono text-slate-300 relative overflow-hidden">
                            <div className="absolute top-2 right-2">
                                {singleResult.verdict === 'PASS' ? (
                                    <CheckCircle2 size={16} className="text-emerald-400" />
                                ) : singleResult.verdict === 'NEUTRAL' ? (
                                    <AlertTriangle size={16} className="text-amber-400" />
                                ) : (
                                    <XCircle size={16} className="text-rose-400" />
                                )}
                            </div>
                            
                            <p className="text-slate-500 uppercase tracking-widest text-[9px] font-bold border-b border-slate-850 pb-1.5">Inspección en Tiempo Real</p>
                            
                            <div className="space-y-1.5">
                                <p className="truncate text-slate-200 font-bold" title={singleResult.url}>{singleResult.url}</p>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Veredicto GSC:</span>
                                    <span className={`font-bold ${singleResult.verdict === 'PASS' ? 'text-emerald-400' : singleResult.verdict === 'NEUTRAL' ? 'text-amber-400' : 'text-rose-400'}`}>
                                        {singleResult.verdict}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">HTTP Status:</span>
                                    <span className={singleResult.httpStatus === 200 ? 'text-emerald-400' : 'text-rose-400'}>
                                        {singleResult.httpStatus}
                                    </span>
                                </div>
                                <div className="flex flex-col mt-2 pt-2 border-t border-slate-900 space-y-1">
                                    <span className="text-slate-500">Cobertura:</span>
                                    <span className="text-slate-300 text-[11px] leading-tight">{singleResult.coverageState}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Rastreo:</span>
                                    <span className="text-slate-400 text-[11px]">{singleResult.lastCrawlTime !== 'N/A' ? new Date(singleResult.lastCrawlTime).toLocaleDateString() : 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Robots.txt:</span>
                                    <span className="text-slate-400 text-[11px] truncate max-w-[120px]" title={singleResult.robotsTxtState}>{singleResult.robotsTxtState}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Recommendations and Errors Logs */}
                <div className="ds-card p-6 bg-slate-900/40 border border-slate-800/80 rounded-xl lg:col-span-2 space-y-4">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-teal-400" />
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Acciones y Recomendaciones de Indexación</h3>
                    </div>

                    <div className="space-y-3.5 text-xs text-slate-300 max-h-[260px] overflow-y-auto pr-1">
                        {errorsList.length > 0 && (
                            <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg space-y-1.5">
                                <p className="font-bold text-red-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                                    <XCircle size={12} /> Caídas Críticas en Rutas
                                </p>
                                <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1 font-mono">
                                    {errorsList.map((err, i) => (
                                        <li key={i} className="truncate">
                                            URL: <code className="text-slate-400 font-sans">{err.url}</code> devolvió HTTP <strong className="text-red-400">{err.httpStatus}</strong>
                                        </li>
                                    ))}
                                </ul>
                                <p className="text-[10px] text-slate-400 pt-1">
                                    → <strong>Recomendación:</strong> Valida que las rutas no hayan sido eliminadas, que el servidor esté activo y no falten redirecciones 301.
                                </p>
                            </div>
                        )}

                        {unindexedList.length > 0 && (
                            <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg space-y-1.5">
                                <p className="font-bold text-amber-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                                    <AlertTriangle size={12} /> Páginas Pendientes de Indexación
                                </p>
                                <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1 font-mono">
                                    {unindexedList.slice(0, 3).map((un, i) => (
                                        <li key={i} className="truncate">
                                            <code className="text-slate-400 font-sans">{un.url}</code> ({un.coverageState})
                                        </li>
                                    ))}
                                    {unindexedList.length > 3 && <li>y {unindexedList.length - 3} páginas más.</li>}
                                </ul>
                                <p className="text-[10px] text-slate-400 pt-1">
                                    → <strong>Recomendación:</strong> Ingresa a Google Search Console y solicita la indexación manual para estas URLs, o verifica que la URL esté enlazada internamente para facilitar el rastreo orgánico de Google.
                                </p>
                            </div>
                        )}

                        {errorsList.length === 0 && unindexedList.length === 0 && (
                            <div className="p-5 bg-teal-500/5 border border-teal-500/10 rounded-lg flex flex-col items-center justify-center text-center space-y-2 py-8">
                                <CheckCircle2 className="text-teal-400 w-8 h-8 animate-bounce" />
                                <h4 className="font-bold text-white">¡Muestra en Perfecto Estado!</h4>
                                <p className="text-slate-400 text-xs max-w-sm">
                                    No se encontraron códigos HTTP de error ni problemas de robots.txt en las URLs analizadas. Tus canales orgánicos esenciales se encuentran estables.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* ── Table Results Panel ── */}
            <div className="relative z-10 ds-card bg-slate-900/40 border border-slate-800/80 rounded-xl overflow-hidden">
                
                {/* Filters Row */}
                <div className="p-4 border-b border-slate-800/80 bg-slate-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Filtrar URL o post del blog..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 hover:border-slate-850 focus:border-teal-500/50 text-white rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2 p-1 bg-slate-950 border border-slate-850 rounded-lg self-start md:self-auto">
                        {['ALL', 'PASS', 'NEUTRAL', 'FAIL'].map(fl => (
                            <button
                                key={fl}
                                onClick={() => setVerdictFilter(fl)}
                                className={`px-3 py-1 rounded text-xs font-mono ${verdictFilter === fl ? 'bg-teal-500/20 text-teal-400 border border-teal-500/25' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {fl === 'ALL' ? 'Todos' : fl === 'PASS' ? 'Indexed' : fl === 'NEUTRAL' ? 'Pending' : 'Errors'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Responsive Table */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs font-sans">
                        <thead>
                            <tr className="border-b border-slate-850 bg-slate-950/30 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                                <th className="p-4 font-semibold">URL Auditada</th>
                                <th className="p-4 font-semibold text-center">Veredicto GSC</th>
                                <th className="p-4 font-semibold">Cobertura / Estado</th>
                                <th className="p-4 font-semibold text-center">Último Rastreo</th>
                                <th className="p-4 font-semibold text-center">Live HTTP</th>
                                <th className="p-4 font-semibold text-center">Robots.txt</th>
                                <th className="p-4 font-semibold text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                            {filteredResults.length > 0 ? (
                                filteredResults.map((r, idx) => {
                                    const verdictBadge = r.verdict === 'PASS' 
                                        ? { label: 'PASS', style: 'border-emerald-500/25 text-emerald-400 bg-emerald-500/5' }
                                        : r.verdict === 'NEUTRAL'
                                        ? { label: 'NEUTRAL', style: 'border-amber-500/25 text-amber-400 bg-amber-500/5' }
                                        : { label: r.verdict || 'UNKNOWN', style: 'border-rose-500/25 text-rose-400 bg-rose-500/5' };
                                    
                                    const isHttpOk = typeof r.httpStatus === 'number' ? r.httpStatus === 200 : false;

                                    return (
                                        <tr key={idx} className="hover:bg-slate-900/20 transition-colors group">
                                            <td className="p-4 font-mono text-slate-300">
                                                <div className="flex flex-col max-w-[340px] lg:max-w-md xl:max-w-xl">
                                                    <span className="truncate" title={r.url}>{r.url}</span>
                                                    <span className="text-[10px] text-slate-500 truncate mt-0.5">legacymarksas.com</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${verdictBadge.style}`}>
                                                    {verdictBadge.label}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-400 max-w-[150px] truncate" title={r.coverageState}>
                                                {r.coverageState}
                                            </td>
                                            <td className="p-4 text-center text-slate-500 font-mono">
                                                {r.lastCrawlTime !== 'N/A' 
                                                    ? new Date(r.lastCrawlTime).toLocaleDateString() + ' ' + new Date(r.lastCrawlTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                                                    : 'N/A'}
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${isHttpOk ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' : 'border-rose-500/20 text-rose-400 bg-rose-500/5'}`}>
                                                    {r.httpStatus}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center text-slate-400 font-mono max-w-[110px] truncate" title={r.robotsTxtState}>
                                                {r.robotsTxtState}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end items-center gap-2">
                                                    <button
                                                        onClick={() => handleCopy(r.url, idx)}
                                                        className="p-1 hover:bg-slate-800 text-slate-500 hover:text-teal-400 rounded transition-all"
                                                        title="Copiar URL"
                                                    >
                                                        {copiedIndex === idx ? <Check size={12} className="text-teal-400" /> : <Link2Icon size={12} />}
                                                    </button>
                                                    <a
                                                        href={r.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1 hover:bg-slate-800 text-slate-500 hover:text-teal-400 rounded transition-all"
                                                        title="Visitar URL"
                                                    >
                                                        <ExternalLink size={12} />
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-500 font-mono">
                                        No se encontraron resultados para los filtros actuales.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// Inline replacement for missing lucide icon Link2
function Link2Icon({ size }: { size: number }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-link-2">
            <path d="M9 17H7A5 5 0 0 1 7 7h2" />
            <path d="M15 7h2a5 5 0 0 1 0 10h-2" />
            <line x1="8" x2="16" y1="12" y2="12" />
        </svg>
    );
}
