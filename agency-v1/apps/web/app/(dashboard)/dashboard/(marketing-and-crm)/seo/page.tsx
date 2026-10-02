import { getGSCCredentialsStatus, getLatestReport, fetchSitemapUrlsAction } from "@/actions/seo";
import { SeoDashboardClient } from "./seo-client";

export const dynamic = 'force-dynamic';

export const metadata = {
    title: "Monitor SEO GSC | LegacyMark Command Center",
    description: "Inspección de URLs e indexación en tiempo real a través de la API de Google Search Console.",
};

export default async function SeoDashboardPage() {
    const [credsStatus, latestReport, sitemapUrls] = await Promise.all([
        getGSCCredentialsStatus(),
        getLatestReport(),
        fetchSitemapUrlsAction()
    ]);

    return (
        <SeoDashboardClient 
            initialCredsStatus={credsStatus}
            initialReport={latestReport}
            sitemapUrls={sitemapUrls}
        />
    );
}
