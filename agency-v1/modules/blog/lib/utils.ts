/**
 * Blog Module - Utilities
 * Helper functions for blog operations
 */

/**
 * Generate a URL-friendly slug from a string
 */
export function generateSlug(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Calculate reading time in minutes
 */
export function calculateReadTime(content: string): number {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return minutes;
}

/**
 * Truncate text to a specific length
 */
export function truncateText(text: string, maxLength: number = 150): string {
    if (text.length <= maxLength) return text;

    // Try to break at a word boundary
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');

    if (lastSpace > 0) {
        return truncated.substring(0, lastSpace) + '...';
    }

    return truncated + '...';
}

/**
 * Strip HTML tags from content
 */
export function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
}

/**
 * Extract excerpt from content
 */
export function extractExcerpt(content: string, maxLength: number = 200): string {
    const plainText = stripHtml(content);
    return truncateText(plainText, maxLength);
}

/**
 * Format date for display
 */
export function formatPostDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(new Date(date));
}

/**
 * Get relative time (e.g., "2 hours ago")
 */
export function getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return formatPostDate(date);
}
