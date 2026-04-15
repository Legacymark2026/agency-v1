import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { approved } = body;

    // Check if this is a restore request
    if (body.action === 'restore') {
      await prisma.comment.update({
        where: { id },
        data: { deleted: false, deletedAt: null }
      });
      return NextResponse.json({ success: true });
    }

    // Default: approve/disapprove
    await prisma.comment.update({
      where: { id },
      data: { approved }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating comment status:', error);
    return NextResponse.json({ error: 'Error al actualizar estado' }, { status: 500 });
  }
}