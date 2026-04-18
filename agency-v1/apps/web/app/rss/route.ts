import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://legacymark.com';

    // Get published posts
    const posts = await prisma.post.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' },
        take: 50, // Limit to last 50 posts
        include: {
            author: { select: { name: true } },
            categories: { select: { name: true } }
        }
    });

    // Build RSS XML
    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
    <channel>
        <title>LegacyMark Blog</title>
        <link>${baseUrl}/blog</link>
        <description>Últimas publicaciones y novedades del mundo del marketing digital.</description>
        <language>es-ES</language>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        <atom:link href="${baseUrl}/rss" rel="self" type="application/rss+xml"/>
        <image>
            <url>${baseUrl}/logo.png</url>
            <title>LegacyMark Blog</title>
            <link>${baseUrl}</link>
        </image>
        ${posts.map(post => `
        <item>
            <title><![CDATA[${post.title}]]></title>
            <link>${baseUrl}/blog/${post.slug}</link>
            <guid isPermaLink="true">${baseUrl}/blog/${post.slug}</guid>
            <description><![CDATA[${post.excerpt || post.metaDescription || ''}]]></description>
            <content:encoded><![CDATA[${post.content}]]></content:encoded>
            <pubDate>${new Date(post.createdAt).toUTCString()}</pubDate>
            <author>${post.author?.name || 'Editor'}</author>
            ${post.categories.map(cat => `<category>${cat.name}</category>`).join('\n            ')}
        </item>`).join('')}
    </channel>
</rss>`;

    return new NextResponse(rssXml, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600'
        }
    });
}
