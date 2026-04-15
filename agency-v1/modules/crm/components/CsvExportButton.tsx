"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function CsvExportButton({ deals }: { deals: any[] }) {
    function handleDownload() {
        if (!deals || deals.length === 0) return;

        const headers = ["ID", "Title", "Value", "Stage", "Priority", "Contact Name", "Contact Email", "Notes", "Weighted Value"];
        const rows = deals.map(deal => [
            deal.id,
            `"${deal.title}"`,
            deal.value,
            deal.stage,
            deal.priority,
            `"${deal.contactName || ''}"`,
            deal.contactEmail || '',
            `"${deal.notes || ''}"`,
            (deal.value * (deal.probability || 0) / 100).toFixed(2)
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `pipeline_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
        </Button>
    )
}
