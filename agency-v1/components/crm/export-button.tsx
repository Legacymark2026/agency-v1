"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportToCSV } from "@/lib/csv-export";
import { useState } from "react";
import { toast } from "sonner";

interface CRMExportButtonProps {
    stats: Record<string, any>;
    advancedStats: Record<string, any>;
}

export function CRMExportButton({ stats, advancedStats }: CRMExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = () => {
        setIsExporting(true);
        setTimeout(() => {
            const exportData = [
                { Metric: "Pipeline Total", Value: stats.pipelineValue },
                { Metric: "Active Deals", Value: stats.activeDeals },
                { Metric: "Win Rate", Value: `${stats.winRate}%` },
                { Metric: "Avg Deal Size", Value: stats.avgDealSize },
                { Metric: "Forecast Next 3 Months", Value: advancedStats.forecastValue },
                { Metric: "Won Value (Month)", Value: advancedStats.wonValue },
                { Metric: "Month Over Month Growth", Value: `${advancedStats.momGrowth}%` },
                { Metric: "Avg Days to Close", Value: advancedStats.avgDaysToClose },
            ];

            exportToCSV(exportData, `CRM_Performance_Report_${new Date().toISOString().split('T')[0]}`);
            toast.success("¡Exportación exitosa!", { description: "Tu reporte CSV se ha descargado correctamente." });
            setIsExporting(false);
        }, 600); // Fake delay for UX animation
    };

    return (
        <Button
            size="sm"
            className={`hidden md:flex h-10 gap-2 transition-all duration-300 rounded-xl border-none shadow-[0_4px_14px_0_rgba(15,23,42,0.1)] hover:shadow-[0_6px_20px_rgba(15,23,42,0.15)] px-4 font-semibold ${isExporting ? 'bg-emerald-500 hover:bg-emerald-600 text-white w-32 justify-center' : 'bg-slate-800 hover:bg-slate-900 text-white'}`}
            onClick={handleExport}
            disabled={isExporting}
        >
            {isExporting ? (
                <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Exprt...</span>
                </>
            ) : (
                <>
                    <Download className="h-4 w-4" />
                    <span>Export CSV</span>
                </>
            )}
        </Button>
    );
}
