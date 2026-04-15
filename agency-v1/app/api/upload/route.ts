import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/auth";

// Extended configuration to handle larger uploads (especially video files)
// This only applies in Next.js Page Router or specific configs, but we use modern Next.js body limits configuration
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
            // Raw binary upload (bypasses Next.js FormData parsing issues on large payloads)
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
                return NextResponse.json({ error: "Conexión interrumpida o archivo truncado. Sube una a una o mejora la red." }, { status: 400 });
            }
            fileSize = buffer.length;
        }

        // Sanitización del nombre del archivo y metadata
        const extension = originalName.split('.').pop()?.toLowerCase() || '';
        
        // Determinar "assetType" basado en extensión y mime
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

        // Crear nombre seguro a prueba de inyecciones
        const safeSlug = originalName.toLowerCase().replace(/[^a-z0-9.]/g, '-').replace(/-+/g, '-').slice(0, 50);
        const fileName = `${Date.now()}_${uuidv4().split('-')[0]}_${safeSlug}`;

        // Organización de subida por Directorios Anuales/Mensuales para rendimiento
        const date = new Date();
        const yearMonthFolder = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const uploadDir = join(process.cwd(), "public", "uploads", yearMonthFolder);

        // Crear directorio si no existe (recursive true)
        await mkdir(uploadDir, { recursive: true });

        // Escribir en el VPS Hard Drive
        const filePath = join(uploadDir, fileName);
        await writeFile(filePath, buffer);

        // Retornar la URL interceptada para evitar problemas de caché estática de Next.js
        const publicUrl = `/api/serve/${yearMonthFolder}/${fileName}`;
        
        return NextResponse.json({ 
            success: true, 
            url: publicUrl,
            name: originalName,
            size: fileSize,
            mimeType: mimeType,
            type: assetType, // 'image', 'video', 'document'
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
