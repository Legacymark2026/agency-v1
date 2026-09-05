/**
 * Enterprise Feed Domain Models
 * ─────────────────────────────────────────────────────────────────────────────
 * Hexagonal Domain Models for Corporate Publications, Nested Comments, and Reactions.
 */

export type AudienceScope = "COMPANY_WIDE" | "DEPARTMENT" | "CONFIDENTIAL_MANAGEMENT";
export type ReactionType = "LIKE" | "LOVE" | "CELEBRATE" | "INSIGHTFUL" | "CURIOUS";

export interface EnterprisePostDomain {
  id: string;
  companyId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string | null;
  title?: string | null;
  content: string;
  mediaUrls: string[];
  audienceScope: AudienceScope;
  departmentId?: string | null;
  tags: string[];
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  reactionsCount?: Record<ReactionType, number>;
  commentsCount?: number;
  userHasReacted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnterprisePostCommentDomain {
  id: string;
  postId: string;
  companyId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string | null;
  parentId?: string | null;
  content: string;
  replies?: EnterprisePostCommentDomain[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EnterprisePostReactionDomain {
  id: string;
  postId: string;
  companyId: string;
  userId: string;
  type: ReactionType;
  createdAt: Date;
}
