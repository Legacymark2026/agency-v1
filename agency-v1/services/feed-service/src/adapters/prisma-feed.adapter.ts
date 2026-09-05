/**
 * Prisma PostgreSQL Feed Repository Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 * Implements IFeedRepositoryPort with tenant isolation and audience filtering.
 */
import { prisma } from "@agency/database";
import { IFeedRepositoryPort, FeedQueryFilter } from "../core/ports/feed.ports";
import {
  EnterprisePostDomain,
  EnterprisePostCommentDomain,
  EnterprisePostReactionDomain,
  ReactionType
} from "../domain/feed.domain";

export class PrismaFeedRepositoryAdapter implements IFeedRepositoryPort {
  public async savePost(
    post: Omit<EnterprisePostDomain, "id" | "viewCount" | "isLocked" | "createdAt" | "updatedAt">
  ): Promise<EnterprisePostDomain> {
    const created = await (prisma as any).enterprisePost.create({
      data: {
        companyId: post.companyId,
        authorId: post.authorId,
        authorName: post.authorName,
        authorAvatar: post.authorAvatar,
        title: post.title,
        content: post.content,
        mediaUrls: post.mediaUrls,
        audienceScope: post.audienceScope,
        departmentId: post.departmentId,
        tags: post.tags,
        isPinned: post.isPinned
      }
    });

    return this.mapPost(created);
  }

  public async findFeedPosts(filter: FeedQueryFilter): Promise<EnterprisePostDomain[]> {
    const whereClause: any = {
      companyId: filter.companyId
    };

    // Audience filtering
    const audienceConditions: any[] = [{ audienceScope: "COMPANY_WIDE" }];
    if (filter.departmentId) {
      audienceConditions.push({ audienceScope: "DEPARTMENT", departmentId: filter.departmentId });
    }
    if (filter.userRoles?.includes("ADMIN") || filter.userRoles?.includes("SUPERADMIN") || filter.userRoles?.includes("C_LEVEL")) {
      audienceConditions.push({ audienceScope: "CONFIDENTIAL_MANAGEMENT" });
    }

    whereClause.OR = audienceConditions;

    if (filter.beforeCursor) {
      whereClause.createdAt = { lt: new Date(filter.beforeCursor) };
    }

    const posts = await (prisma as any).enterprisePost.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { comments: true, reactions: true }
        }
      },
      orderBy: [
        { isPinned: "desc" },
        { createdAt: "desc" }
      ],
      take: filter.limit || 20
    });

    return posts.map((p: any) => ({
      ...this.mapPost(p),
      commentsCount: p._count?.comments || 0,
      reactionsCount: {
        LIKE: 0,
        LOVE: 0,
        CELEBRATE: 0,
        INSIGHTFUL: 0,
        CURIOUS: 0
      }
    }));
  }

  public async findPostById(companyId: string, postId: string): Promise<EnterprisePostDomain | null> {
    const post = await (prisma as any).enterprisePost.findFirst({
      where: { id: postId, companyId },
      include: {
        _count: {
          select: { comments: true, reactions: true }
        }
      }
    });

    if (!post) return null;
    return {
      ...this.mapPost(post),
      commentsCount: post._count?.comments || 0
    };
  }

  public async saveComment(
    comment: Omit<EnterprisePostCommentDomain, "id" | "createdAt" | "updatedAt">
  ): Promise<EnterprisePostCommentDomain> {
    const created = await (prisma as any).enterprisePostComment.create({
      data: {
        companyId: comment.companyId,
        postId: comment.postId,
        authorId: comment.authorId,
        authorName: comment.authorName,
        authorAvatar: comment.authorAvatar,
        parentId: comment.parentId,
        content: comment.content
      }
    });

    return {
      id: created.id,
      postId: created.postId,
      companyId: created.companyId,
      authorId: created.authorId,
      authorName: created.authorName,
      authorAvatar: created.authorAvatar,
      parentId: created.parentId,
      content: created.content,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt
    };
  }

  public async findCommentsByPost(companyId: string, postId: string): Promise<EnterprisePostCommentDomain[]> {
    const comments = await (prisma as any).enterprisePostComment.findMany({
      where: { companyId, postId },
      orderBy: { createdAt: "asc" }
    });

    // Build comment reply trees
    const rootComments: EnterprisePostCommentDomain[] = [];
    const commentMap = new Map<string, EnterprisePostCommentDomain>();

    comments.forEach((c: any) => {
      const node: EnterprisePostCommentDomain = {
        id: c.id,
        postId: c.postId,
        companyId: c.companyId,
        authorId: c.authorId,
        authorName: c.authorName,
        authorAvatar: c.authorAvatar,
        parentId: c.parentId,
        content: c.content,
        replies: [],
        createdAt: c.createdAt,
        updatedAt: c.updatedAt
      };
      commentMap.set(node.id, node);
      if (!c.parentId) {
        rootComments.push(node);
      } else {
        const parent = commentMap.get(c.parentId);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(node);
        } else {
          rootComments.push(node);
        }
      }
    });

    return rootComments;
  }

  public async toggleReaction(
    reaction: Omit<EnterprisePostReactionDomain, "id" | "createdAt">
  ): Promise<{ reacted: boolean; type: ReactionType }> {
    const existing = await (prisma as any).enterprisePostReaction.findFirst({
      where: {
        companyId: reaction.companyId,
        postId: reaction.postId,
        userId: reaction.userId
      }
    });

    if (existing) {
      if (existing.type === reaction.type) {
        // Toggle OFF
        await (prisma as any).enterprisePostReaction.delete({
          where: { id: existing.id }
        });
        return { reacted: false, type: reaction.type };
      } else {
        // Update Reaction Type
        await (prisma as any).enterprisePostReaction.update({
          where: { id: existing.id },
          data: { type: reaction.type }
        });
        return { reacted: true, type: reaction.type };
      }
    }

    // Create reaction
    await (prisma as any).enterprisePostReaction.create({
      data: {
        companyId: reaction.companyId,
        postId: reaction.postId,
        userId: reaction.userId,
        type: reaction.type
      }
    });

    return { reacted: true, type: reaction.type };
  }

  public async deletePostById(companyId: string, postId: string): Promise<void> {
    await (prisma as any).enterprisePost.deleteMany({
      where: { id: postId, companyId }
    });
  }

  public async incrementViewCount(companyId: string, postId: string): Promise<void> {
    await (prisma as any).enterprisePost.updateMany({
      where: { id: postId, companyId },
      data: { viewCount: { increment: 1 } }
    });
  }

  private mapPost(p: any): EnterprisePostDomain {
    return {
      id: p.id,
      companyId: p.companyId,
      authorId: p.authorId,
      authorName: p.authorName,
      authorAvatar: p.authorAvatar,
      title: p.title,
      content: p.content,
      mediaUrls: p.mediaUrls as string[] || [],
      audienceScope: p.audienceScope as any,
      departmentId: p.departmentId,
      tags: p.tags as string[] || [],
      isPinned: p.isPinned,
      isLocked: p.isLocked,
      viewCount: p.viewCount,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    };
  }
}
