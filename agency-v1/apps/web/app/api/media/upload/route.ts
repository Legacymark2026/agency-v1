import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const maxDuration = 120;

// Tamaños máximos por tipo (en bytes)
const MAX_SIZES: Record<string, number> = {
  video:    500 * 1024 * 1024, // 500 MB
  image:     50 * 1024 * 1024, //  50 MB
  document: 100 * 1024 * 1024, // 100 MB
  audio:    100 * 1024 * 1024, // 100 MB
  other:     50 * 1024 * 1024, //  50 MB
};

function getAssetType(mimeType: string, ext: string): string {
  if (mimeType.startsWith('video/') || ['mp4','mov','webm','avi','mkv'].includes(ext)) return 'video';
  if (mimeType.startsWith('image/') || ['jpg','jpeg','png','webp','gif','svg'].includes(ext)) return 'image';
  if (mimeType.startsWith('audio/') || ['mp3','wav','aac','ogg','flac'].includes(ext)) return 'audio';
  if (['pdf','doc','docx','xls','xlsx','csv','txt'].includes(ext)) return 'document';
  return 'other';
}

async function getCompanyId(userId: string): Promise<string | null> {
  const cu = await prisma.companyUser.findFirst({
    where: { userId },
    select: { companyId: true },
  });
  return cu?.companyId ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = await getCompanyId(session.user.id);
    if (!companyId) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const metaRaw = formData.get('metadata') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No se encontró el archivo' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const mimeType = file.type || 'application/octet-stream';
    const assetType = getAssetType(mimeType, ext);

    // Bloquear extensiones peligrosas
    const dangerous = ['exe','bat','sh','php','js','html','cmd','ps1','vbs','py','rb'];
    if (dangerous.includes(ext)) {
      return NextResponse.json({ error: 'Tipo de archivo no permitido' }, { status: 400 });
    }

    // Verificar tamaño
    const maxSize = MAX_SIZES[assetType] ?? MAX_SIZES.other;
    if (file.size > maxSize) {
      return NextResponse.json({
        error: `Archivo demasiado grande. Máximo: ${Math.round(maxSize / 1024 / 1024)} MB`,
      }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Crear directorio organizado por empresa y tipo
    const uploadDir = join(process.cwd(), 'public', 'uploads', companyId, assetType);
    await mkdir(uploadDir, { recursive: true });

    // Nombre único y seguro
    const safeOriginal = file.name.toLowerCase().replace(/[^a-z0-9.]/g, '-').slice(0, 60);
    const fileName = `${Date.now()}_${uuidv4().split('-')[0]}_${safeOriginal}`;
    const filePath = join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    // URL relativa accesible via /api/serve/
    const relativeUrl = `/api/serve/uploads/${companyId}/${assetType}/${fileName}`;

    // Metadata adicional (dimensiones, duración, etc.) enviada desde el cliente
    let extra: Record<string, any> = {};
    if (metaRaw) {
      try { extra = JSON.parse(metaRaw); } catch { /* ignorar */ }
    }

    // Persistir en base de datos
    const asset = await prisma.mediaAsset.create({
      data: {
        companyId,
        uploadedById: session.user.id,
        name: (extra.name as string) || file.name,
        originalName: file.name,
        url: relativeUrl,
        mimeType,
        type: assetType,
        sizeBytes: file.size,
        duration:   (extra.duration   as number)  ?? null,
        width:      (extra.width      as number)  ?? null,
        height:     (extra.height     as number)  ?? null,
        fps:        (extra.fps        as number)  ?? null,
        resolution: (extra.resolution as string)  ?? null,
        tags:       (extra.tags       as string[]) ?? [],
        metadata:   extra,
      },
    });

    return NextResponse.json({
      success: true,
      asset: {
        id:         asset.id,
        url:        asset.url,
        name:       asset.name,
        type:       asset.type,
        mimeType:   asset.mimeType,
        sizeBytes:  asset.sizeBytes,
        duration:   asset.duration,
        resolution: asset.resolution,
        createdAt:  asset.createdAt,
      },
    });

  } catch (error: any) {
    console.error('Media Upload Error:', error);
    return NextResponse.json(
      { error: `Error procesando el archivo: ${error.message}` },
      { status: 500 },
    );
  }
}
