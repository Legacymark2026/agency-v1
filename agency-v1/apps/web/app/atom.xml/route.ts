import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { siteConfig } from "@/lib/site-config";

export async function GET() {
    const baseUrl = siteConfig.url;

    const posts = await prisma.post.findMany({
        where: { published: true },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
            author: { select: { name: true } },
            categories: { select: { name: true } },
        },
    });

    const updated = posts.length > 0
        ? new Date(posts[0].createdAt).toISOString()
        : new Date().toISOString();

    const atomXml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="es">
  <id>${baseUrl}/</id>
  <title>${siteConfig.name} Blog</title>
  <subtitle>${siteConfig.description}</subtitle>
  <link rel="alternate" type="text/html" href="${baseUrl}/es/blog"/>
  <link rel="self" type="application/atom+xml" href="${baseUrl}/atom.xml"/>
  <updated>${updated}</updated>
  <author>
    <name>${siteConfig.name}</name>
    <uri>${baseUrl}</uri>
  </author>
  <rights>© ${new Date().getFullYear()} ${siteConfig.name}</rights>
  ${posts
        .map(
            (post) => `<entry>
    <id>${baseUrl}/es/blog/${post.slug}</id>
    <title><![CDATA[${post.title}]]></title>
    <link rel="alternate" type="text/html" href="${baseUrl}/es/blog/${post.slug}"/>
    <updated>${new Date(post.createdAt).toISOString()}</updated>
    <published>${new Date(post.createdAt).toISOString()}</published>
    <author><name>${post.author?.name || "Editor"}</name></author>
    <summary type="html"><![CDATA[${(post as any).excerpt || (post as any).metaDescription || ""}]]></summary>
    <content type="html"><![CDATA[${post.content}]]></content>
    ${post.categories.map((cat) => `<category term="${cat.name}"/>`).join("\n    ")}
  </entry>`
        )
        .join("\n  ")}
</feed>`;

    return new NextResponse(atomXml, {
        headers: {
            "Content-Type": "application/atom+xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
    });
}
