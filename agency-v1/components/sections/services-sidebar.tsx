"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui/button";

const serviceLinks = [
    { name: "Visión General", href: "/servicios" },
    { name: "Estrategia de Marca", href: "/servicios/estrategia" },
    { name: "Marketing Digital", href: "/servicios/marketing" },
    { name: "Publicidad & Medios", href: "/servicios/publicidad" },
    { name: "Diseño & Creatividad", href: "/servicios/diseno" },
    { name: "Analytics & ROI", href: "/servicios/analytics" },
];

export function ServicesSidebar() {
    const pathname = usePathname();

    return (
        <nav className="flex flex-col space-y-2">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Servicios
            </h3>
            {serviceLinks.map((link) => (
                <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                        "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-white/5 hover:text-white",
                        pathname === link.href
                            ? "bg-white/10 text-white"
                            : "text-gray-400"
                    )}
                >
                    {link.name}
                </Link>
            ))}
        </nav>
    );
}
