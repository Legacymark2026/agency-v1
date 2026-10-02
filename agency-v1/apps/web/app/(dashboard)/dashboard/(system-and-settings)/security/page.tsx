import { getSecurityLogs, getSecurityStats } from "@/actions/admin";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { LogsFilter } from "./_components/logs-filter";
import { LogsTable } from "./_components/logs-table";
import { SecurityStats } from "./_components/security-stats";
import { SecurityPagination } from "./_components/security-pagination";
import { Shield } from "lucide-react";

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SecurityLogsPage({ searchParams }: PageProps) {
    const resolvedParams = await searchParams;
    const page = Number(resolvedParams.page) || 1;
    const search = resolvedParams.search as string | undefined;
    const type = resolvedParams.type as string | undefined;

    // Fetch real data in parallel — includes a 4th stat: active sessions
    const session = await auth();
    const [logsResult, statsResult, activeSessions] = await Promise.all([
        getSecurityLogs({ page, limit: 15, search, type }),
        getSecurityStats(),
        prisma.session.count(),
    ]);

    if ('error' in logsResult) {
        return (
            <div className="flex items-center justify-center h-64 text-red-400 bg-red-500/5 border border-red-500/20 rounded-xl font-mono text-sm">
                ⚠ Error cargando logs: {logsResult.error}
            </div>
        );
    }

    const { logs, pagination } = logsResult;
    const stats = 'error' in statsResult ? { totalEvents: 0, failedLogins: 0, uniqueUsers: 0 } : statsResult;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/10 border border-red-500/20 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-100">Seguridad y Auditoría</h1>
                        <p className="text-xs text-slate-500 font-mono">Monitoreo de actividad, accesos y alertas del sistema en tiempo real.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    Sistema activo · {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>

            {/* KPI Stats */}
            <SecurityStats
                totalEvents={stats.totalEvents}
                failedLogins={stats.failedLogins}
                uniqueUsers={stats.uniqueUsers}
                activeSessions={activeSessions}
            />

            {/* Log Table Area */}
            <div className="space-y-3">
                <LogsFilter />
                <LogsTable logs={logs} />
                <SecurityPagination
                    currentPage={page}
                    totalPages={pagination?.pages || 1}
                    totalLogs={pagination?.total || 0}
                />
            </div>
        </div>
    );
}
