import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const companyId = searchParams.get("companyId");

    if (!q || q.trim() === "") {
      return NextResponse.json({ results: [] });
    }

    if (!companyId) {
      return NextResponse.json({ error: "companyId is required" }, { status: 400 });
    }

    // Verify company access
    const userAccess = await prisma.companyUser.findFirst({
      where: {
        userId: session.user.id,
        companyId: companyId,
      },
    });

    if (!userAccess) {
      return NextResponse.json({ error: "Access denied to this company" }, { status: 403 });
    }

    // Perform Full-Text Search utilizing PostgreSQL GIN index compat queries
    // We use plainto_tsquery to handle user input safely
    const results = await prisma.$queryRaw`
      SELECT 
        m.id as "messageId",
        m.content as "messageContent",
        m.created_at as "messageCreatedAt",
        m.direction,
        c.id as "conversationId",
        c.channel,
        l.name as "leadName",
        l.id as "leadId",
        ts_rank(to_tsvector('english', coalesce(m.content, '')), plainto_tsquery('english', ${q})) as rank
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      LEFT JOIN leads l ON c.lead_id = l.id
      WHERE c.company_id = ${companyId}
        AND m.content IS NOT NULL
        AND to_tsvector('english', coalesce(m.content, '')) @@ plainto_tsquery('english', ${q})
      ORDER BY rank DESC, m.created_at DESC
      LIMIT 50;
    `;

    return NextResponse.json({ results });
  } catch (error) {
    logger.error("[Inbox Search API] Error executing full-text search", {
      error: error instanceof Error ? error.message : String(error),
      url: req.url,
    });
    return NextResponse.json(
      { error: "Internal server error during search" },
      { status: 500 }
    );
  }
}
