import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/auth";

// Extended configuration to handle larger uploads
export const maxDuration = 120; // 2 minutes for processing larger files

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const contentType = req.headers.get("content-type") || "";
        let buffer: Buffer;
        let originalName: string;
        let mimeType: string;
        let fileSize: number;

        if (contentType.includes("multipart/form-data")) {
            const formData = await req.formData();
            const file = formData.get("file") as File;
            if (!file) {
                return NextResponse.json({ error: "No se encontró el archivo" }, { status: 400 });
            }
            buffer = Buffer.from(await file.arrayBuffer());
            originalName = file.name;
            mimeType = file.type || 'application/octet-stream';
            fileSize = file.size;
        } else {
            // Raw binary upload
            buffer = Buffer.from(await req.arrayBuffer());
            if (buffer.length === 0) {
                return NextResponse.json({ error: "No se encontró el archivo (buffer vacío)" }, { status: 400 });
            }
            
            originalName = req.nextUrl.searchParams.get('name') || `file_${Date.now()}`;
            mimeType = req.nextUrl.searchParams.get('type') || contentType || 'application/octet-stream';
            
            // Validate truncation
            const expectedSize = parseInt(req.nextUrl.searchParams.get('size') || '0', 10);
            if (expectedSize > 0 && buffer.length !== expectedSize) {
                console.error(`Upload truncado: Se esperaban ${expectedSize} bytes pero se recibieron ${buffer.length} bytes.`);
                return NextResponse.json({ error: "Conexión interrumpida o archivo truncado." }, { status: 400 });
            }
            fileSize = buffer.length;
        }

        // Sanitización del nombre del archivo y metadata
        const extension = originalName.split('.').pop()?.toLowerCase() || '';
        
        let assetType = 'document';
        if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif'].includes(extension)) {
            assetType = 'image';
        } else if (mimeType.startsWith('video/') || ['mp4', 'mov', 'webm', 'avi'].includes(extension)) {
            assetType = 'video';
        }

        // Bloquear extensiones peligrosas
        const dangerousExtensions = ['exe', 'bat', 'sh', 'php', 'js', 'html', 'cmd', 'ps1', 'vbs'];
        if (dangerousExtensions.includes(extension)) {
            return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 400 });
        }

        // Crear nombre seguro
        const safeSlug = originalName.toLowerCase().replace(/[^a-z0-9.]/g, '-').replace(/-+/g, '-').slice(0, 50);
        const fileName = `${Date.now()}_${uuidv4().split('-')[0]}_${safeSlug}`;

        // Subir a Vercel Blob
        const blob = await put(`uploads/${fileName}`, buffer, {
            access: 'public',
            contentType: mimeType,
        });
        
        return NextResponse.json({ 
            success: true, 
            url: blob.url,
            name: originalName,
            size: fileSize,
            mimeType: mimeType,
            type: assetType,
            extension: extension
        });

    } catch (error: any) {
        console.error("Upload Error:", error);
        return NextResponse.json(
            { error: `Error interno procesando el archivo: ${error.message || String(error)}` }, 
            { status: 500 }
        );
    }
}
