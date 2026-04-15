'use client';

import { SessionProvider, useSession } from "next-auth/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toaster } from "sonner";
import { Suspense } from "react";
import { AnalyticsProvider } from "@/modules/analytics/components/analytics-provider";
import type { Session } from "next-auth";

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

