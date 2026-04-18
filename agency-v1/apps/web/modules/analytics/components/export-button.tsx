'use client';

import { useState } from 'react';
import { FileDown, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExportButtonProps {
    data?: any;
}

export function ExportButton({ data }: ExportButtonProps) {
    const [isExporting, setIsExporting] = useState<'pdf' | 'csv' | null>(null);

    const handleExportPDF = async () => {
        setIsExporting('pdf');

        // Simulate export delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Create PDF content (simplified)
        const content = `
REPORTE DE ANALÍTICA WEB
========================
Generado: ${new Date().toLocaleString('es-ES')}

MÉTRICAS PRINCIPALES
--------------------
Usuarios Totales: 14,230 (+20.1%)
Sesiones Activas: 573 (+180)
Domain Authority: 42 (+2)
Tasa de Conversión: 3.2% (+0.4%)

TRÁFICO POR DISPOSITIVO
-----------------------
Desktop: 5,840 (41%)
Mobile: 6,230 (44%)
Tablet: 2,160 (15%)

TOP PÁGINAS
-----------
1. /inicio - 12,450 visitas
2. /servicios - 8,320 visitas
3. /blog - 6,840 visitas
4. /contacto - 4,210 visitas
5. /portfolio - 3,890 visitas
        `;

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);

        setIsExporting(null);
    };

    const handleExportCSV = async () => {
        setIsExporting('csv');

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Create CSV content
        const csvContent = `Métrica,Valor,Cambio
Usuarios Totales,14230,+20.1%
Sesiones Activas,573,+180
Domain Authority,42,+2
Tasa de Conversión,3.2%,+0.4%

Dispositivo,Usuarios,Porcentaje
Desktop,5840,41%
Mobile,6230,44%
Tablet,2160,15%

Página,Visitas,Tiempo Promedio,Bounce Rate
/inicio,12450,2:34,32.5%
/servicios,8320,3:12,28.1%
/blog,6840,4:45,22.3%
/contacto,4210,1:28,45.2%
/portfolio,3890,3:56,18.7%`;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-data-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        setIsExporting(null);
    };

    return (
        <div className="flex items-center gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={isExporting !== null}
                className="flex items-center gap-2"
            >
                {isExporting === 'pdf' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <FileDown className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">PDF</span>
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={isExporting !== null}
                className="flex items-center gap-2"
            >
                {isExporting === 'csv' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <FileSpreadsheet className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">CSV</span>
            </Button>
        </div>
    );
}
