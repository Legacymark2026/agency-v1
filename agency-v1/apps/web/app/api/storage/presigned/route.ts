import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { objectStorageEngine } from '@/lib/storage/object-storage-engine';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json().catch(() => ({}));

    const { fileName, mimeType, sizeBytes, metadata } = body;

    if (!fileName || !mimeType) {
      return NextResponse.json({ error: 'fileName y mimeType son requeridos' }, { status: 400 });
    }

    const companyId = session?.user?.companyId || 'default-company';
    const presigned = objectStorageEngine.generatePresignedUploadUrl(
      fileName,
      mimeType,
      sizeBytes || 0,
      companyId,
      metadata || {}
    );

    return NextResponse.json({
      success: true,
      data: presigned,
    });
  } catch (error: any) {
    console.error('Presigned URL Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error generando URL firmada de almacenamiento' },
      { status: 500 }
    );
  }
}
