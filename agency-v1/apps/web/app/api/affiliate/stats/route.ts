import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const AFFILIATE_URL = process.env.AFFILIATE_SERVICE_URL ?? 'http://localhost:4019';

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
        }

        const res = await fetch(`${AFFILIATE_URL}/api/affiliates/stats?userId=${session.user.id}`, {
            headers: { 'Content-Type': 'application/json', 'X-Internal-User-Id': session.user.id },
            next: { revalidate: 30 },
        });

        if (!res.ok) {
            const body = await res.text();
            return NextResponse.json({ success: false, error: body }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (err: any) {
        console.error('[api/affiliate/stats]', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
