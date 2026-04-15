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
        <div className="flex items-center gap-1 rounded-full border border-gray-200 bg-white p-0.5 shadow-sm">
            <button
                onClick={() => switchLocale('es')}
                disabled={isPending}
                aria-label="Español"
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-200 ${locale === 'es'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
            >
                <span className="text-sm leading-none">🇨🇴</span>
                <span>ES</span>
            </button>
            <button
                onClick={() => switchLocale('en')}
                disabled={isPending}
                aria-label="English"
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-200 ${locale === 'en'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
            >
                <span className="text-sm leading-none">🇺🇸</span>
                <span>EN</span>
            </button>
        </div>
    );
}
