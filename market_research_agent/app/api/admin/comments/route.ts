import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'all';
    const postId = searchParams.get('postId');
    const search = searchParams.get('search');

    // Get posts for this company through author relationship
    const posts = await prisma.post.findMany({
      where: { author: { companyId: session.user.companyId } },
      select: { id: true }
    });
    const postIds = posts.map(p => p.id);

    const where: any = {
      postId: { in: postIds }
    };

    if (status === 'approved') where.approved = true;
    if (status === 'pending') where.approved = false;
    if (status === 'deleted') where.deleted = true;
    if (status === 'all') where.deleted = false;

    if (postId) where.postId = postId;
    if (search) where.content = { contains: search };

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        include: {
          post: { select: { id: true, title: true, slug: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.comment.count({ where })
    ]);

    return NextResponse.json({
      comments: comments.map(c => ({
        id: c.id,
        content: c.content,
        authorName: c.authorName,
        authorEmail: c.authorEmail,
        approved: c.approved,
        deleted: c.deleted,
        createdAt: c.createdAt,
        post: c.post
      })),
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Error al obtener comentarios' }, { status: 500 });
  }
}