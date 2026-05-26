import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    try {
        const { path } = await params;
        
        if (!path || path.length === 0 || path.includes('..')) {
            return new NextResponse('Invalid path', { status: 400 });
        }

        // Reconstruct the file path from the array
        // Since path captures everything after /api/serve/, it will include "uploads" if the URL is /api/serve/uploads/...
        // The root directory we join to is already 'public/uploads', so we should strip 'uploads' if it is the first element.
        const pathParts = path[0] === 'uploads' ? path.slice(1) : path;
        const filePath = join(process.cwd(), 'public', 'uploads', ...pathParts);
        const fileName = pathParts.join('/');

        let file: Buffer;
        try {
            file = await readFile(filePath);
        } catch (e) {
            return new NextResponse('File not found', { status: 404 });
        }

        // Determine MIME type
        const extension = fileName.split('.').pop()?.toLowerCase() || '';
        let mimeType = 'application/octet-stream';
        
        const mimeMap: Record<string, string> = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'svg': 'image/svg+xml',
            'mp4': 'video/mp4',
            'mov': 'video/quicktime',
            'webm': 'video/webm',
            'pdf': 'application/pdf'
        };

        if (mimeMap[extension]) {
            mimeType = mimeMap[extension];
        }

        return new NextResponse(new Uint8Array(file), {
            headers: {
                'Content-Type': mimeType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
