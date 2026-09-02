import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteProps) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const post = await prisma.post.findUnique({
      where: { id },
    });
    if (!post) {
      return NextResponse.json({ error: "Artículo no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ post });
  } catch {
    return NextResponse.json({ error: "Error al obtener artículo" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteProps) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const data = await req.json();
    const {
      title,
      slug,
      excerpt,
      content,
      category,
      authorName,
      authorRole,
      imageUrl,
      published,
      readTime,
    } = data;

    const updated = await prisma.post.update({
      where: { id },
      data: {
        title,
        slug,
        excerpt,
        content,
        category,
        authorName,
        authorRole,
        imageUrl,
        published: Boolean(published),
        readTime,
      },
    });

    return NextResponse.json({ success: true, post: updated });
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json({ error: "Error al actualizar artículo" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteProps) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  try {
    await prisma.post.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json({ error: "Error al eliminar artículo" }, { status: 500 });
  }
}
