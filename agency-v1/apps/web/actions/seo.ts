'use server';

import { auth } from "@/lib/auth";
import fs from 'fs';
import path from 'path';
import { getIntegrationConfig } from "@/actions/integration-config";

// Types
export interface GSCResult {
    url: string;
    verdict: string;
    coverageState: string;
    indexingState: string;
    lastCrawlTime: string;
    robotsTxtState: string;
    httpStatus: number | string;
    error?: string;
}

export interface GSCReport {
    timestamp: string;
    totalUrls: number;
    auditedCount: number;
    indexedCount: number;
    results: GSCResult[];
}

// Helpers
function findCredentialsPath(): string | null {
    const searchPaths = [
        path.join(process.cwd(), 'gsc-credentials.json'),
        path.join(process.cwd(), 'apps/web', 'gsc-credentials.json'),
        path.join(process.cwd(), '../../gsc-credentials.json'),
        path.join(process.cwd(), '../..', 'gsc-credentials.json'),
        'C:\\Users\\hboho\\.gemini\\antigravity\\scratch\\agency-v1\\gsc-credentials.json'
    ];
    for (const p of searchPaths) {
        if (fs.existsSync(p)) {
            return p;
        }
    }
    return null;
}

function findCachePath(): string {
    const credPath = findCredentialsPath();
    if (credPath) {
        return path.join(path.dirname(credPath), 'gsc-report-cache.json');
    }
    return path.join(process.cwd(), 'gsc-report-cache.json');
}

async function getAccessToken(creds: { client_id: string; client_secret: string; refresh_token: string }): Promise<string> {
    const params = new URLSearchParams({
        client_id: creds.client_id,
        client_secret: creds.client_secret,
        refresh_token: creds.refresh_token,
        grant_type: 'refresh_token'
    });

    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString(),
        cache: 'no-store'
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Google Auth failed: Status ${res.status} | ${errText}`);
    }

    const data = await res.json();
    return data.access_token;
}

// Helper to get GSC credentials dynamically from database or file
async function getGSCCredentials() {
    // 1. Try to read from db first
    try {
        const dbConfig = await getIntegrationConfig('google-search-console');
        if (dbConfig?.clientId && dbConfig?.clientSecret && dbConfig?.refreshToken) {
            return {
                client_id: dbConfig.clientId,
                client_secret: dbConfig.clientSecret,
                refresh_token: dbConfig.refreshToken,
                source: 'db'
            };
        }
    } catch (e) {
        console.error("Error reading GSC credentials from DB:", e);
    }

    // 2. Fall back to local file
    const credPath = findCredentialsPath();
    if (!credPath) {
        return null;
    }
    try {
        const content = fs.readFileSync(credPath, 'utf8');
        const creds = JSON.parse(content);
        if (creds.client_id && creds.client_secret && creds.refresh_token) {
            return {
                client_id: creds.client_id,
                client_secret: creds.client_secret,
                refresh_token: creds.refresh_token,
                source: 'file'
            };
        }
    } catch (e) {
        console.error("Error reading GSC credentials from file:", e);
    }
    return null;
}

// 1. GSC Credentials Status check
export async function getGSCCredentialsStatus() {
    const session = await auth();
    if (!session?.user) return { configured: false, error: "Unauthorized" };

    try {
        const creds = await getGSCCredentials();
        if (creds) {
            return { 
                configured: true, 
                clientId: creds.client_id.substring(0, 15) + '...',
                source: creds.source 
            };
        }
        return { configured: false, error: "Credentials not configured in DB or local file" };
    } catch (e: any) {
        return { configured: false, error: `Error reading credentials: ${e.message}` };
    }
}

// 2. Load latest report cache
export async function getLatestReport(): Promise<GSCReport | null> {
    const session = await auth();
    if (!session?.user) return null;

    const cachePath = findCachePath();
    if (!fs.existsSync(cachePath)) {
        return null;
    }

    try {
        const content = fs.readFileSync(cachePath, 'utf8');
        return JSON.parse(content) as GSCReport;
    } catch (e) {
        console.error("Error reading GSC cache:", e);
        return null;
    }
}

// 3. Fetch sitemap URLs
export async function fetchSitemapUrlsAction(): Promise<string[]> {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const sitemapUrl = 'https://legacymarksas.com/sitemap.xml';
    
    try {
        const res = await fetch(sitemapUrl, { cache: 'no-store' });
        if (!res.ok) {
            throw new Error(`Failed to fetch sitemap: Status ${res.status}`);
        }
        const data = await res.text();
        const regex = /<loc>(.*?)<\/loc>/g;
        const urls: string[] = [];
        let match;
        while ((match = regex.exec(data)) !== null) {
            urls.push(match[1]);
        }
        return urls;
    } catch (e) {
        console.error("Sitemap fetch failed, using fallback static routes:", e);
        // Fallbacks
        return [
            "https://legacymarksas.com/es",
            "https://legacymarksas.com/es/servicios",
            "https://legacymarksas.com/es/soluciones/automatizacion",
            "https://legacymarksas.com/es/soluciones/web-dev",
            "https://legacymarksas.com/es/portfolio",
            "https://legacymarksas.com/es/blog",
            "https://legacymarksas.com/en",
            "https://legacymarksas.com/en/servicios"
        ];
    }
}

// 4. Perform batch URL GSC inspection and save report
export async function inspectUrlsAction(urls: string[]): Promise<GSCReport> {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const creds = await getGSCCredentials();
    if (!creds) {
        throw new Error("Credentials not configured. Please register them in Settings or run oauth flow.");
    }

    const accessToken = await getAccessToken(creds);
    const results: GSCResult[] = [];

    // Run inspections sequentially or with a tiny delay to respect rate limit
    for (const url of urls) {
        // GSC Inspect
        const result = await inspectUrl(accessToken, url);
        
        // Parallel HTTP verification
        try {
            const httpRes = await fetch(url, { method: 'GET', cache: 'no-store', headers: { 'User-Agent': 'Mozilla/5.0 (GSC-Monitor)' } });
            result.httpStatus = httpRes.status;
        } catch (err: any) {
            result.httpStatus = `ERROR: ${err.message}`;
        }

        results.push(result);
        // Brief sleep to avoid hitting rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    const indexedCount = results.filter(r => r.verdict === 'PASS').length;

    // Fetch total count of sitemap URLs to present in HUD
    let totalSitemapUrls = urls.length;
    try {
        const fullList = await fetchSitemapUrlsAction();
        totalSitemapUrls = fullList.length;
    } catch (e) {
        // ignore
    }

    const report: GSCReport = {
        timestamp: new Date().toISOString(),
        totalUrls: totalSitemapUrls,
        auditedCount: urls.length,
        indexedCount: indexedCount,
        results: results
    };

    // Save to cache
    try {
        const cachePath = findCachePath();
        fs.writeFileSync(cachePath, JSON.stringify(report, null, 2), 'utf8');
    } catch (e) {
        console.error("Failed to write report cache:", e);
    }

    return report;
}

// 5. Inspect single URL in real-time
export async function inspectSingleUrlAction(url: string): Promise<GSCResult> {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const creds = await getGSCCredentials();
    if (!creds) {
        throw new Error("Credentials not configured.");
    }

    const accessToken = await getAccessToken(creds);
    
    const result = await inspectUrl(accessToken, url);
    
    // HTTP check
    try {
        const httpRes = await fetch(url, { method: 'GET', cache: 'no-store' });
        result.httpStatus = httpRes.status;
    } catch (err: any) {
        result.httpStatus = `ERROR: ${err.message}`;
    }

    // Proactively update cache if it exists
    try {
        const cachePath = findCachePath();
        if (fs.existsSync(cachePath)) {
            const currentCache = JSON.parse(fs.readFileSync(cachePath, 'utf8')) as GSCReport;
            const existingIndex = currentCache.results.findIndex(r => r.url === url);
            if (existingIndex !== -1) {
                currentCache.results[existingIndex] = result;
            } else {
                currentCache.results.unshift(result);
                currentCache.auditedCount += 1;
            }
            // Recalculate indexed
            currentCache.indexedCount = currentCache.results.filter(r => r.verdict === 'PASS').length;
            currentCache.timestamp = new Date().toISOString();
            fs.writeFileSync(cachePath, JSON.stringify(currentCache, null, 2), 'utf8');
        }
    } catch (e) {
        console.error("Failed to update cache with single URL result:", e);
    }

    return result;
}

// URL Inspection API client implementation
async function inspectUrl(accessToken: string, targetUrl: string): Promise<GSCResult> {
    try {
        const res = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inspectionUrl: targetUrl,
                siteUrl: 'sc-domain:legacymarksas.com',
                languageCode: 'es'
            }),
            cache: 'no-store'
        });

        if (!res.ok) {
            const errText = await res.text();
            return {
                url: targetUrl,
                verdict: 'ERROR',
                coverageState: `API Error ${res.status}: ${errText.substring(0, 100)}`,
                indexingState: 'UNKNOWN',
                lastCrawlTime: 'N/A',
                robotsTxtState: 'UNKNOWN',
                httpStatus: 'N/A',
                error: `GSC status ${res.status}`
            };
        }

        const data = await res.json();
        const indexStatus = data.inspectionResult?.indexStatusResult || {};

        return {
            url: targetUrl,
            verdict: indexStatus.verdict || 'UNKNOWN',
            coverageState: indexStatus.coverageState || 'Sin datos',
            indexingState: indexStatus.indexingState || 'UNKNOWN',
            lastCrawlTime: indexStatus.lastCrawlTime || 'N/A',
            robotsTxtState: indexStatus.robotsTxtState || 'UNKNOWN',
            httpStatus: 'N/A'
        };
    } catch (err: any) {
        return {
            url: targetUrl,
            verdict: 'ERROR',
            coverageState: `Error de red: ${err.message}`,
            indexingState: 'UNKNOWN',
            lastCrawlTime: 'N/A',
            robotsTxtState: 'UNKNOWN',
            httpStatus: 'N/A',
            error: err.message
        };
    }
}
