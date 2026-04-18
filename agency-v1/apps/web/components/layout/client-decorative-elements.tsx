'use client';

import dynamic from "next/dynamic";

const DecorativeElements = dynamic<{ locale: string }>(
    () => import("./decorative-elements").then(mod => mod.DecorativeElements),
    { ssr: false }
);

export function ClientDecorativeElements({ locale }: { locale: string }) {
    return <DecorativeElements locale={locale} />;
}
