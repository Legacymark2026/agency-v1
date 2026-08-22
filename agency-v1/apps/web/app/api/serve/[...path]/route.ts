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
        const pathParts = path[0] === 'uploads' ? path.slice(1) : path;
        const filePath = join(process.cwd(), 'public', 'uploads', ...pathParts);
        const fileName = pathParts.join('/');

        let file: Buffer;
        try {
            file = await readFile(filePath);
        } catch (e) {
            const extension = fileName.split('.').pop()?.toLowerCase() || '';
            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension);
            if (isImage) {
                const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="#1e293b"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#64748b" font-size="12">Sin Imagen</text></svg>`;
                return new NextResponse(placeholderSvg, {
                    headers: {
                        'Content-Type': 'image/svg+xml',
                        'Cache-Control': 'no-cache',
                    },
                });
            }
            return new NextResponse('File not found', { status: 404 });
        }

        // Determine MIME type
        const extension = fileName.split('.').pop()?.toLowerCase() || '';
        
        const mimeMap: Record<string, string> = {
            // Audio formats for Voice Notes
            'mp3': 'audio/mpeg',
            'ogg': 'audio/ogg',
            'wav': 'audio/wav',
            'm4a': 'audio/m4a',
            'aac': 'audio/aac',
            'webm': 'audio/webm',
            'opus': 'audio/opus',

            // Images
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'svg': 'image/svg+xml',

            // Videos
            'mp4': 'video/mp4',
            'mov': 'video/quicktime',

            // Documents
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'csv': 'text/csv',
            'txt': 'text/plain',
            'zip': 'application/zip',
            'rar': 'application/x-rar-compressed',
            'json': 'application/json',
        };

        const mimeType = mimeMap[extension] || 'application/octet-stream';

        return new NextResponse(new Uint8Array(file), {
            headers: {
                'Content-Type': mimeType,
                'Content-Disposition': 'inline',
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Accept-Ranges': 'bytes',
            },
        });
    } catch (error) {
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
