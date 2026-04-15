import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
    // A list of all locales that are supported
    locales: ['es', 'en'],
    // Used when no locale matches
    defaultLocale: 'es',
    // Prefix strategy: always show /es or /en in the URL
    localePrefix: 'always',
});
