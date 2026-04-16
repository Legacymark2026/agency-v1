import { NextRequest, NextResponse } from 'next/server';

/**
 * /api/webhooks/meta — Thin Proxy
 *
 * Meta's Developer Portal only allows ONE callback URL per app. This route acts
 * as the canonical entry-point registered in Meta for all Meta-family channels
 * (Messenger, Instagram, WhatsApp). It determines the correct channel provider
 * from the webhook `object` field and forwards the request to the unified
 * /api/webhooks/channels/[provider] handler so all processing, persistence and
 * AI dispatch stays in one place.
 *
 * Supported channel mapping:
 *   object=page        → /api/webhooks/channels/facebook   (Messenger)
 *   object=instagram   → /api/webhooks/channels/instagram
 *   object=whatsapp_business_account → /api/webhooks/channels/whatsapp
 *
 * For GET (challenge verification) Meta sends hub.mode + hub.verify_token;
 * we forward to the facebook provider which reads META_WEBHOOK_VERIFY_TOKEN.
 */

// Derive the base URL from env so it works on VPS, Vercel and localhost.
function getBaseUrl() {
    return (
        process.env.NEXTAUTH_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        'http://localhost:3000'
    );
}

/**
 * GET: Webhook challenge / verification
 */
export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const base = `${url.protocol}//${url.host}`;
    const targetUrl = `${base}/api/webhooks/channels/facebook${req.nextUrl.search}`;

    console.log('[Meta Proxy] GET → forwarding challenge to', targetUrl);

    try {
        const res = await fetch(targetUrl, {
            method: 'GET',
            headers: Object.fromEntries(req.headers.entries()),
        });

        const body = await res.text();
        return new NextResponse(body, { status: res.status });
    } catch (err) {
        console.error('[Meta Proxy] GET forward failed:', err);
        return new NextResponse('Internal Proxy Error', { status: 500 });
    }
}

/**
 * POST: Incoming events (messages, reactions, ad insights…)
 *
 * We must forward the RAW body verbatim so the downstream signature
 * verification with x-hub-signature-256 still works.
 */
export async function POST(req: NextRequest) {
    const rawBody = await req.text();
    const url = new URL(req.url);
    const base = `${url.protocol}//${url.host}`;

    // Peek at the object field to route to the right provider
    let object = '';
    try {
        const json = JSON.parse(rawBody);
        object = (json.object as string) || '';
    } catch {
        console.error('[Meta Proxy] Could not parse body as JSON');
        return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
    }

    const providerMap: Record<string, string> = {
        page: 'facebook',
        instagram: 'instagram',
        whatsapp_business_account: 'whatsapp',
    };

    const provider = providerMap[object];

    if (!provider) {
        // Unknown object type – acknowledge with 200 so Meta stops retrying
        console.warn(`[Meta Proxy] Unknown object type: "${object}" — ignoring`);
        return NextResponse.json({ received: true });
    }

    const targetUrl = `${base}/api/webhooks/channels/${provider}`;

    console.log(`[Meta Proxy] POST object="${object}" → forwarding to ${targetUrl}`);

    // Forward with identical headers (preserves x-hub-signature-256)
    const forwardHeaders: Record<string, string> = {};
    req.headers.forEach((value, key) => {
        forwardHeaders[key] = value;
    });

    try {
        const res = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                ...forwardHeaders,
                'content-type': 'application/json',
            },
            body: rawBody,
        });

        // Always return 200 to Meta — never let downstream errors trigger Meta retries
        if (!res.ok) {
            const errText = await res.text();
            console.error(`[Meta Proxy] Downstream error ${res.status}:`, errText);
        }

        return NextResponse.json({ received: true }, { status: 200 });
    } catch (err) {
        console.error('[Meta Proxy] Fetch to downstream failed:', err);
        // Still 200 to avoid Meta disabling the webhook subscription
        return NextResponse.json({ received: true }, { status: 200 });
    }
}
