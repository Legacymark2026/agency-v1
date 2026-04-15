'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    baseUrl: string; // Base URL without page param, e.g. "/blog" or "/blog?category=tech"
}

export function Pagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
    if (totalPages <= 1) return null;

    // Generate page URL
    const getPageUrl = (page: number) => {
        const separator = baseUrl.includes('?') ? '&' : '?';
        return page === 1 ? baseUrl : `${baseUrl}${separator}page=${page}`;
    };

    // Calculate which pages to show
    const getPageNumbers = () => {
        const pages: (number | 'ellipsis')[] = [];
        const showEllipsis = totalPages > 7;

        if (!showEllipsis) {
            // Show all pages
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            if (currentPage > 3) {
                pages.push('ellipsis');
            }

            // Pages around current
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (currentPage < totalPages - 2) {
                pages.push('ellipsis');
            }

            // Always show last page
            pages.push(totalPages);
        }

        return pages;
    };

    const pages = getPageNumbers();

    return (
        <nav
            className="flex items-center justify-center gap-1 sm:gap-2"
            aria-label="Paginación"
        >
            {/* Previous Button */}
            <Link
                href={currentPage > 1 ? getPageUrl(currentPage - 1) : '#'}
                className={`
                    flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${currentPage === 1
                        ? 'text-gray-300 cursor-not-allowed pointer-events-none'
                        : 'text-gray-600 hover:bg-gray-100'
                    }
                `}
                aria-disabled={currentPage === 1}
            >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Anterior</span>
            </Link>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
                {pages.map((page, index) => (
                    page === 'ellipsis' ? (
                        <span
                            key={`ellipsis-${index}`}
                            className="px-2 text-gray-400"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </span>
                    ) : (
                        <Link
                            key={page}
                            href={getPageUrl(page)}
                            className={`
                                w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-all
                                ${page === currentPage
                                    ? 'bg-gray-900 text-white shadow-lg'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }
                            `}
                            aria-current={page === currentPage ? 'page' : undefined}
                        >
                            {page}
                        </Link>
                    )
                ))}
            </div>

            {/* Next Button */}
            <Link
                href={currentPage < totalPages ? getPageUrl(currentPage + 1) : '#'}
                className={`
                    flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${currentPage === totalPages
                        ? 'text-gray-300 cursor-not-allowed pointer-events-none'
                        : 'text-gray-600 hover:bg-gray-100'
                    }
                `}
                aria-disabled={currentPage === totalPages}
            >
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight className="h-4 w-4" />
            </Link>
        </nav>
    );
}
