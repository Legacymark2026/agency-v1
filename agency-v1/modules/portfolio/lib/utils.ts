/**
 * Portfolio Module - Utilities
 */

import type { ProjectCategory } from '../types';

/**
 * Generate slug from project title
 */
export function generateProjectSlug(title: string): string {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Get category display name
 */
export function getCategoryName(category: ProjectCategory): string {
    const names: Record<ProjectCategory, string> = {
        WEB_DESIGN: 'Web Design',
        WEB_DEVELOPMENT: 'Web Development',
        MOBILE_APP: 'Mobile App',
        BRANDING: 'Branding',
        MARKETING: 'Marketing',
        ECOMMERCE: 'E-Commerce',
        UI_UX: 'UI/UX Design',
        OTHER: 'Other',
    };
    return names[category];
}

/**
 * Get category color for badges
 */
export function getCategoryColor(category: ProjectCategory): string {
    const colors: Record<ProjectCategory, string> = {
        WEB_DESIGN: 'purple',
        WEB_DEVELOPMENT: 'blue',
        MOBILE_APP: 'green',
        BRANDING: 'pink',
        MARKETING: 'orange',
        ECOMMERCE: 'red',
        UI_UX: 'indigo',
        OTHER: 'gray',
    };
    return colors[category];
}

/**
 * Format metrics for display
 */
export function formatMetric(value: number, type: 'percentage' | 'currency' | 'number'): string {
    switch (type) {
        case 'percentage':
            return `${value > 0 ? '+' : ''}${value}%`;
        case 'currency':
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
            }).format(value);
        case 'number':
            return new Intl.NumberFormat('en-US').format(value);
        default:
            return String(value);
    }
}
