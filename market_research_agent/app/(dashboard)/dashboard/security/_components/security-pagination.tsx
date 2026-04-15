"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface SecurityPaginationProps {
    currentPage: number;
    totalPages: number;
    totalLogs: number;
}

export function SecurityPagination({ currentPage, totalPages, totalLogs }: SecurityPaginationProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const createPageURL = (pageNumber: number) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", pageNumber.toString());
        return `?${params.toString()}`;
    };

    const handlePageChange = (page: number) => {
        router.push(createPageURL(page));
    };

    if (totalPages <= 1) return null;

    // Build page numbers for pagination
    const pageNumbers: (number | "...")[] = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
        pageNumbers.push(1);
        if (currentPage > 3) pageNumbers.push("...");
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
            pageNumbers.push(i);
        }
        if (currentPage < totalPages - 2) pageNumbers.push("...");
        pageNumbers.push(totalPages);
    }

    return (
        <div className="flex items-center justify-between px-1">
            <div className="text-[11px] font-mono text-slate-500">
                Página <span className="text-teal-400 font-bold">{currentPage}</span> de{" "}
                <span className="text-slate-300">{totalPages}</span>{" "}
                <span className="text-slate-600">· {totalLogs.toLocaleString()} eventos</span>
            </div>

            <div className="flex items-center gap-1">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="w-8 h-8 rounded-lg border border-slate-800 flex items-center justify-center text-slate-500 hover:text-white hover:border-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    <ChevronLeft size={14} />
                </button>

                {pageNumbers.map((p, i) =>
                    p === "..." ? (
                        <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-slate-600 text-xs">…</span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => handlePageChange(p as number)}
                            className={`w-8 h-8 rounded-lg border text-xs font-mono transition-all ${
                                currentPage === p
                                    ? "border-teal-500/40 bg-teal-500/10 text-teal-400 font-bold"
                                    : "border-slate-800 text-slate-500 hover:text-white hover:border-slate-600"
                            }`}
                        >
                            {p}
                        </button>
                    )
                )}

                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="w-8 h-8 rounded-lg border border-slate-800 flex items-center justify-center text-slate-500 hover:text-white hover:border-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
}
