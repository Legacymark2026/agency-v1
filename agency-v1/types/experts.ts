/**
 * types/experts.ts
 * Tipo compartido para Expert — usado por page.tsx y ExpertCard.tsx
 * para evitar incompatibilidades de tipos en callbacks.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Expert {
    id: string;
    name: string;
    role: string;
    bio: string | null;
    imageUrl: string | null;
    socialLinks: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    badgeId: string | null;
    iconName: string | null;
    skills: string[];
    isVisible: boolean;
    order: number;
}
