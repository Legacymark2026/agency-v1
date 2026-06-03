import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
    // A list of all locales that are supported
    locales: ['es', 'en'],
    // Used when no locale matches
    defaultLocale: 'es',
    // URLs with /es/ and /en/ for International SEO
    localePrefix: 'always',
});
