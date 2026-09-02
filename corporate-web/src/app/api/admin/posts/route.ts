import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";

  try {
    const posts = await prisma.post.findMany({
      where: search
        ? {
            OR: [
              { title: { contains: search } },
              { excerpt: { contains: search } },
              { category: { contains: search } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json({ error: "Error al obtener posts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const {
      title,
      slug: customSlug,
      excerpt,
      content,
      category = "Estrategia",
      authorName = "Equipo Editorial",
      authorRole = "NEOGESTIÓN Consulting",
      imageUrl = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
      published = true,
      readTime = "5 min de lectura",
    } = data;

    if (!title || !excerpt || !content) {
      return NextResponse.json(
        { error: "Título, resumen y contenido son obligatorios" },
        { status: 400 }
      );
    }

    // Generar slug
    const baseSlug = (customSlug || title)
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Verificar si ya existe slug
    let uniqueSlug = baseSlug;
    let counter = 1;
    while (await prisma.post.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const post = await prisma.post.create({
      data: {
        title,
        slug: uniqueSlug,
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

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json({ error: "Error al crear artículo" }, { status: 500 });
  }
}
