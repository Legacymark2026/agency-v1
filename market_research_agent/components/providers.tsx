'use client';

import { SessionProvider, useSession } from "next-auth/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toaster } from "sonner";
import { Suspense } from "react";
import { AnalyticsProvider } from "@/modules/analytics/components/analytics-provider";

function AnalyticsWrapper({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();

    return (
        <AnalyticsProvider userId={session?.user?.id} enabled={true}>
            {children}
        </AnalyticsProvider>
    );
}

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
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
