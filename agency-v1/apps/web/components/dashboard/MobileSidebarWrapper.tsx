"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";

export function MobileSidebarWrapper({ sidebar }: { sidebar: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    // Close on route change
    useEffect(() => {
        setOpen(false);
    }, [pathname]);

    // Prevent body scroll when open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [open]);

    return (
        <>
            <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:hidden shrink-0 sticky top-0 z-30 shadow-sm">
                <span className="font-bold text-slate-900 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-500 text-white flex items-center justify-center font-black">LM</div>
                    Dashboard
                </span>
                <button onClick={() => setOpen(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                    <Menu size={24} />
                </button>
            </header>

            {/* Mobile Overlay */}
            {open && (
                <div
                    className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Sidebar Transform Wrapper */}
            <div className={`fixed inset-y-0 left-0 z-50 h-[100dvh] transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:h-screen shadow-2xl md:shadow-none flex flex-col ${open ? "translate-x-0" : "-translate-x-full"}`}>
                {/* Close Button on Mobile only */}
                <button
                    onClick={() => setOpen(false)}
                    className="md:hidden absolute top-4 right-4 z-50 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-1.5 transition-colors"
                >
                    <X size={20} />
                </button>
                {sidebar}
            </div>
        </>
    );
}
