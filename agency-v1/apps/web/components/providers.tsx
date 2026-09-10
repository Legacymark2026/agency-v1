'use client';

import { SessionProvider, useSession } from "next-auth/react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";
import { Suspense } from "react";
import { AnalyticsProvider } from "@/modules/analytics/components/analytics-provider";
import type { Session } from "next-auth";
import { useUIStore } from "@/lib/stores/ui-store";
import { useEffect } from "react";

function AppearanceEnforcer() {
    const accent = useUIStore((state) => state.accent);
    const density = useUIStore((state) => state.density);
    const font = useUIStore((state) => state.font);
    const bgTheme = useUIStore((state) => state.bgTheme);
    const borderRadius = useUIStore((state) => state.borderRadius);
    const glassmorphism = useUIStore((state) => state.glassmorphism);
    const highContrast = useUIStore((state) => state.highContrast);
    const animationsEnabled = useUIStore((state) => state.animationsEnabled);
    const { theme } = useTheme();

    useEffect(() => {
        const root = document.documentElement;

        // Remove old classes
        root.classList.forEach((cls) => {
            if (
                cls.startsWith('theme-') || 
                cls.startsWith('density-') || 
                cls.startsWith('font-') || 
                cls.startsWith('bg-') ||
                cls.startsWith('radius-')
            ) {
                root.classList.remove(cls);
            }
        });

        // Add new classes
        root.classList.add(`theme-${accent}`);
        root.classList.add(`density-${density}`);
        root.classList.add(`font-${font}`);
        root.classList.add(`bg-${bgTheme}`);
        root.classList.add(`radius-${borderRadius || 'sharp'}`);

        if (highContrast) {
            root.classList.add('high-contrast');
        } else {
            root.classList.remove('high-contrast');
        }

        if (!glassmorphism) {
            root.classList.add('no-glassmorphism');
        } else {
            root.classList.remove('no-glassmorphism');
        }

        if (!animationsEnabled) {
            root.classList.add('disable-animations');
        } else {
            root.classList.remove('disable-animations');
        }
    }, [accent, density, font, bgTheme, borderRadius, glassmorphism, highContrast, animationsEnabled, theme]);

    return null;
}

function AnalyticsWrapper({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();

    return (
        <AnalyticsProvider userId={session?.user?.id} enabled={true}>
            {children}
        </AnalyticsProvider>
    );
}

export function Providers({ children, session }: { children: React.ReactNode; session?: Session | null }) {
    return (
        <SessionProvider session={session}>
            <NextThemesProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                <AppearanceEnforcer />
                <Suspense fallback={null}>
                    <AnalyticsWrapper>
                        {children}
                    </AnalyticsWrapper>
                </Suspense>
                <Toaster richColors closeButton position="top-right" />
            </NextThemesProvider>
        </SessionProvider>
    );
}

