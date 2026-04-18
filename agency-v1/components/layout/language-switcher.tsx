'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useTransition } from 'react';

export function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname(); // pathname WITHOUT locale prefix
    const [isPending, startTransition] = useTransition();

    function switchLocale(nextLocale: string) {
        if (nextLocale === locale) return;
        startTransition(() => {
            // next-intl handles building the correct URL with the new locale
            router.replace(pathname, { locale: nextLocale });
        });
    }

    return (
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-slate-900/50 p-0.5 backdrop-blur-md">
            <button
                onClick={() => switchLocale('es')}
                disabled={isPending}
                aria-label="Español"
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all duration-300 font-mono tracking-widest ${locale === 'es'
                        ? 'bg-teal-500 text-slate-950 shadow-[0_0_15px_rgba(20,184,166,0.4)]'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
            >
                <span className="text-xs leading-none">CO</span>
                <span>ES</span>
            </button>
            <button
                onClick={() => switchLocale('en')}
                disabled={isPending}
                aria-label="English"
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all duration-300 font-mono tracking-widest ${locale === 'en'
                        ? 'bg-teal-500 text-slate-950 shadow-[0_0_15px_rgba(20,184,166,0.4)]'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
            >
                <span className="text-xs leading-none">US</span>
                <span>EN</span>
            </button>
        </div>
    );
}
