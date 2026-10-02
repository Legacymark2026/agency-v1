'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Props {
    href: string;
    label: string;
    code: string;
}

export function AffiliateNavClient({ href, label, code }: Props) {
    const pathname = usePathname();
    // exact match for root overview, prefix match for sub-routes
    const isActive = href === '/dashboard/affiliate'
        ? pathname === '/dashboard/affiliate'
        : pathname.startsWith(href);

    return (
        <Link
            href={href}
            className="flex items-center gap-2 px-4 py-3 font-mono text-xs uppercase tracking-widest transition-all duration-150 border-b-2 whitespace-nowrap"
            style={{
                color: isActive ? '#2dd4bf' : '#475569',
                borderBottomColor: isActive ? '#0d9488' : 'transparent',
                background: isActive ? 'rgba(13,148,136,0.05)' : 'transparent',
            }}
        >
            <span className="text-[9px] font-bold opacity-40">[{code}]</span>
            {label}
        </Link>
    );
}
