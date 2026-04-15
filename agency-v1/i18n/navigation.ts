/**
 * i18n/navigation.ts
 * ──────────────────
 * Exporta hooks de navegación locale-aware de next-intl.
 * Se debe usar en lugar de next/navigation para que los
 * cambios de idioma funcionen correctamente.
 */
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } =
    createNavigation(routing);
