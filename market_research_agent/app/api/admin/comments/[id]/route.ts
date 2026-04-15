import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    // Get posts for this company through author relationship
    const posts = await prisma.post.findMany({
      where: { author: { companyId: session.user.companyId } },
      select: { id: true }
    });
    const postIds = posts.map(p => p.id);

    const comment = await prisma.comment.findFirst({
      where: { 
        id,
        postId: { in: postIds }
      },
      include: {
        post: { select: { id: true, title: true, slug: true } }
      }
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comentario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      id: comment.id,
      content: comment.content,
      authorName: comment.authorName,
      authorEmail: comment.authorEmail,
      approved: comment.approved,
      deleted: comment.deleted,
      createdAt: comment.createdAt,
      post: comment.post
    });
  } catch (error) {
    console.error('Error fetching comment:', error);
    return NextResponse.json({ error: 'Error al obtener comentario' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const { content } = await req.json();

    const comment = await prisma.comment.update({
      where: { id },
      data: { content }
    });

    return NextResponse.json({ success: true, comment });
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json({ error: 'Error al actualizar comentario' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.comment.update({
      where: { id },
      data: { deleted: true, deletedAt: new Date() }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Error al eliminar comentario' }, { status: 500 });
  }
}