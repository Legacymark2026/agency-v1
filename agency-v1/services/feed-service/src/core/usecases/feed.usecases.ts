/**
 * Enterprise Feed Use Cases
 * ─────────────────────────────────────────────────────────────────────────────
 * Implements IFeedUseCases enforcing multitenancy, role/department visibility,
 * and event dispatching.
 */
import {
  IFeedUseCases,
  IFeedRepositoryPort,
  IFeedEventPublisherPort,
  CreatePostDTO,
  AddCommentDTO,
  ToggleReactionDTO,
  FeedQueryFilter
} from "../ports/feed.ports";
import {
  EnterprisePostDomain,
  EnterprisePostCommentDomain
} from "../domain/feed.domain";

export class FeedUseCases implements IFeedUseCases {
  constructor(
    private readonly repository: IFeedRepositoryPort,
    private readonly eventPublisher: IFeedEventPublisherPort
  ) {}

  public async createPost(dto: CreatePostDTO): Promise<EnterprisePostDomain> {
    if (!dto.content || dto.content.trim().length === 0) {
      throw new Error("Post content cannot be empty.");
    }

    const saved = await this.repository.savePost({
      companyId: dto.companyId,
      authorId: dto.authorId,
      authorName: dto.authorName,
      authorAvatar: dto.authorAvatar || null,
      title: dto.title?.trim() || null,
      content: dto.content.trim(),
      mediaUrls: dto.mediaUrls || [],
      audienceScope: dto.audienceScope || "COMPANY_WIDE",
      departmentId: dto.departmentId || null,
      tags: dto.tags || [],
      isPinned: dto.isPinned || false
    });

    // Asynchronous domain event
    await this.eventPublisher.publishPostCreated(saved).catch(() => {});

    return saved;
  }

  public async getCompanyFeed(filter: FeedQueryFilter): Promise<EnterprisePostDomain[]> {
    return this.repository.findFeedPosts(filter);
  }

  public async getPostById(companyId: string, postId: string): Promise<EnterprisePostDomain> {
    const post = await this.repository.findPostById(companyId, postId);
    if (!post) {
      throw new Error("Post not found or access denied.");
    }

    // Increment async view count
    this.repository.incrementViewCount(companyId, postId).catch(() => {});
    return post;
  }

  public async addComment(dto: AddCommentDTO): Promise<EnterprisePostCommentDomain> {
    if (!dto.content || dto.content.trim().length === 0) {
      throw new Error("Comment content cannot be empty.");
    }

    // Verify post exists in this tenant
    const post = await this.repository.findPostById(dto.companyId, dto.postId);
    if (!post) {
      throw new Error("Cannot comment on non-existent post.");
    }

    if (post.isLocked) {
      throw new Error("Comments are locked on this publication.");
    }

    const comment = await this.repository.saveComment({
      companyId: dto.companyId,
      postId: dto.postId,
      authorId: dto.authorId,
      authorName: dto.authorName,
      authorAvatar: dto.authorAvatar || null,
      parentId: dto.parentId || null,
      content: dto.content.trim()
    });

    await this.eventPublisher.publishCommentAdded(comment).catch(() => {});
    return comment;
  }

  public async getPostComments(companyId: string, postId: string): Promise<EnterprisePostCommentDomain[]> {
    return this.repository.findCommentsByPost(companyId, postId);
  }

  public async toggleReaction(dto: ToggleReactionDTO): Promise<{ reacted: boolean; type: any }> {
    const post = await this.repository.findPostById(dto.companyId, dto.postId);
    if (!post) {
      throw new Error("Post not found.");
    }

    const result = await this.repository.toggleReaction({
      companyId: dto.companyId,
      postId: dto.postId,
      userId: dto.userId,
      type: dto.type
    });

    if (result.reacted) {
      await this.eventPublisher.publishReactionAdded({
        id: "reaction-event",
        companyId: dto.companyId,
        postId: dto.postId,
        userId: dto.userId,
        type: dto.type,
        createdAt: new Date()
      }).catch(() => {});
    }

    return result;
  }

  public async deletePost(
    companyId: string,
    postId: string,
    requestingUserId: string,
    isAdmin: boolean
  ): Promise<void> {
    const post = await this.repository.findPostById(companyId, postId);
    if (!post) {
      throw new Error("Post not found.");
    }

    if (post.authorId !== requestingUserId && !isAdmin) {
      throw new Error("Unauthorized: Only the author or company administrator can delete this post.");
    }

    await this.repository.deletePostById(companyId, postId);
  }
}
