import { NextResponse } from 'next/server';
import { triggerWorkflow } from '@/actions/automation';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { type, data } = body;

        if (!type) {
            return NextResponse.json(
                { success: false, error: 'Missing trigger type' },
                { status: 400 }
            );
        }

        // Security Check
        const apiKey = req.headers.get('x-api-key');
        const validKey = process.env.AUTOMATION_API_KEY || 'dev-key-123'; // Default for dev if not set

        if (apiKey !== validKey) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }



        const result = await triggerWorkflow(type, data || {});

        return NextResponse.json({
            success: true,
            data: result
        });

    } catch (error: unknown) {
        console.error('Trigger API Error:', error);
        return NextResponse.json(
            { success: false, error: (error as Error).message },
            { status: 500 }
        );
    }
}
