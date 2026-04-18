import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

// Public Media Upload for Web Chat
// Allows unauthenticated visitors to upload voice notes and images
export const maxDuration = 60; 

export async function POST(req: NextRequest) {
    try {
        const contentType = req.headers.get("content-type") || "";
        let mimeType = '';
        let originalName = '';
        let buffer: Buffer;
        let fileSize = 0;

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
            buffer = Buffer.from(await req.arrayBuffer());
            originalName = req.nextUrl.searchParams.get('name') || `chat_${Date.now()}`;
            mimeType = req.nextUrl.searchParams.get('type') || contentType || 'application/octet-stream';
            fileSize = buffer.length;
        }

        // Limit size to 10MB
        if (fileSize > 10 * 1024 * 1024) {
             return NextResponse.json({ error: "Archivo demasiado grande (máx 10MB)" }, { status: 400 });
        }

        const isImage = mimeType.startsWith('image/');
        const isAudio = mimeType.startsWith('audio/');

        // Derive correct extension from MIME type to prevent playback issues
        let extension = originalName.split('.').pop()?.toLowerCase() || '';
        if (isAudio) {
            if (mimeType.includes('webm')) extension = 'webm';
            else if (mimeType.includes('ogg')) extension = 'ogg';
            else if (mimeType.includes('mp4')) extension = 'mp4';
            else if (mimeType.includes('mpeg')) extension = 'mp3';
        } else if (isImage) {
            if (mimeType.includes('png')) extension = 'png';
            else if (mimeType.includes('jpeg')) extension = 'jpg';
            else if (mimeType.includes('webp')) extension = 'webp';
            else if (mimeType.includes('gif')) extension = 'gif';
        }

        const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'webm', 'ogg', 'mp3', 'mp4', 'm4a', 'aac'];

        if (!isImage && !isAudio && !allowedExtensions.includes(extension)) {
            return NextResponse.json({ error: "Solo se permiten imágenes y audios en el chat" }, { status: 400 });
        }

        // --- Persistence ---
        const nameWithoutExt = originalName.split('.').slice(0, -1).join('.') || originalName;
        const safeSlug = nameWithoutExt.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30);
        const fileName = `${Date.now()}_${uuidv4().split('-')[0]}_${safeSlug}.${extension}`;

        const date = new Date();
        const folder = `public-chat/${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const uploadDir = join(process.cwd(), "public", "uploads", folder);

        await mkdir(uploadDir, { recursive: true });
        const filePath = join(uploadDir, fileName);
        await writeFile(filePath, buffer);

        const publicUrl = `/uploads/${folder}/${fileName}`;
        
        return NextResponse.json({ 
            success: true, 
            url: publicUrl,
            name: originalName,
            size: fileSize,
            mimeType: mimeType,
            type: isAudio ? 'AUDIO' : (isImage ? 'IMAGE' : 'DOCUMENT')
        });

    } catch (error: any) {
        console.error("Public Chat Upload Error:", error);
        return NextResponse.json(
            { error: "Error procesando el archivo" }, 
            { status: 500 }
        );
    }
}
