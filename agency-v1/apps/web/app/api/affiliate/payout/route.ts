import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { randomUUID } from 'crypto';

const AFFILIATE_URL = process.env.AFFILIATE_SERVICE_URL ?? 'http://localhost:4019';

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
        }

        const body = await req.json();
        const idempotencyKey = req.headers.get('X-Idempotency-Key') ?? randomUUID();

        const res = await fetch(`${AFFILIATE_URL}/api/affiliates/payouts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Idempotency-Key': idempotencyKey,
                'X-Internal-User-Id': session.user.id,
            },
            body: JSON.stringify({ ...body, userId: session.user.id }),
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (err: any) {
        console.error('[api/affiliate/payout]', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
