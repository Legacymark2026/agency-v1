/**
 * Enterprise Feed Ports (Hexagonal Architecture)
 * ─────────────────────────────────────────────────────────────────────────────
 * Defines Inbound (Use Cases) and Outbound (Repository/EventBus) Ports.
 */
import {
  EnterprisePostDomain,
  EnterprisePostCommentDomain,
  EnterprisePostReactionDomain,
  AudienceScope,
  ReactionType
} from "../domain/feed.domain";

export interface CreatePostDTO {
  companyId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  title?: string;
  content: string;
  mediaUrls?: string[];
  audienceScope?: AudienceScope;
  departmentId?: string;
  tags?: string[];
  isPinned?: boolean;
}

export interface AddCommentDTO {
  companyId: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  parentId?: string;
  content: string;
}

export interface ToggleReactionDTO {
  companyId: string;
  postId: string;
  userId: string;
  type: ReactionType;
}

export interface FeedQueryFilter {
  companyId: string;
  userId: string;
  departmentId?: string;
  userRoles?: string[];
  tag?: string;
  limit?: number;
  beforeCursor?: string;
}

// Inbound Ports (Use Cases)
export interface IFeedUseCases {
  createPost(dto: CreatePostDTO): Promise<EnterprisePostDomain>;
  getCompanyFeed(filter: FeedQueryFilter): Promise<EnterprisePostDomain[]>;
  getPostById(companyId: string, postId: string): Promise<EnterprisePostDomain>;
  addComment(dto: AddCommentDTO): Promise<EnterprisePostCommentDomain>;
  getPostComments(companyId: string, postId: string): Promise<EnterprisePostCommentDomain[]>;
  toggleReaction(dto: ToggleReactionDTO): Promise<{ reacted: boolean; type: ReactionType }>;
  deletePost(companyId: string, postId: string, requestingUserId: string, isAdmin: boolean): Promise<void>;
}

// Outbound Ports (Driven Adapters)
export interface IFeedRepositoryPort {
  savePost(post: Omit<EnterprisePostDomain, "id" | "viewCount" | "isLocked" | "createdAt" | "updatedAt">): Promise<EnterprisePostDomain>;
  findFeedPosts(filter: FeedQueryFilter): Promise<EnterprisePostDomain[]>;
  findPostById(companyId: string, postId: string): Promise<EnterprisePostDomain | null>;
  saveComment(comment: Omit<EnterprisePostCommentDomain, "id" | "createdAt" | "updatedAt">): Promise<EnterprisePostCommentDomain>;
  findCommentsByPost(companyId: string, postId: string): Promise<EnterprisePostCommentDomain[]>;
  toggleReaction(reaction: Omit<EnterprisePostReactionDomain, "id" | "createdAt">): Promise<{ reacted: boolean; type: ReactionType }>;
  deletePostById(companyId: string, postId: string): Promise<void>;
  incrementViewCount(companyId: string, postId: string): Promise<void>;
}

export interface IFeedEventPublisherPort {
  publishPostCreated(post: EnterprisePostDomain): Promise<void>;
  publishReactionAdded(reaction: EnterprisePostReactionDomain): Promise<void>;
  publishCommentAdded(comment: EnterprisePostCommentDomain): Promise<void>;
}
