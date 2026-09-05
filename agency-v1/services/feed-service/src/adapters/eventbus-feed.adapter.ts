/**
 * EventBus Feed Publisher Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 * Broadcasts domain events to Redpanda/Kafka/Redis bus.
 */
import { EventBus } from "@agency/events";
import { IFeedEventPublisherPort } from "../core/ports/feed.ports";
import { EnterprisePostDomain, EnterprisePostCommentDomain, EnterprisePostReactionDomain } from "../core/domain/feed.domain";

export class EventBusFeedPublisherAdapter implements IFeedEventPublisherPort {
  constructor(private readonly eventBus: EventBus) {}

  public async publishPostCreated(post: EnterprisePostDomain): Promise<void> {
    await this.eventBus.publish("feed.post.created", {
      postId: post.id,
      companyId: post.companyId,
      authorId: post.authorId,
      authorName: post.authorName,
      title: post.title,
      audienceScope: post.audienceScope,
      departmentId: post.departmentId,
      createdAt: post.createdAt
    });
  }

  public async publishReactionAdded(reaction: EnterprisePostReactionDomain): Promise<void> {
    await this.eventBus.publish("feed.reaction.added", {
      postId: reaction.postId,
      companyId: reaction.companyId,
      userId: reaction.userId,
      type: reaction.type
    });
  }

  public async publishCommentAdded(comment: EnterprisePostCommentDomain): Promise<void> {
    await this.eventBus.publish("feed.comment.added", {
      commentId: comment.id,
      postId: comment.postId,
      companyId: comment.companyId,
      authorId: comment.authorId,
      authorName: comment.authorName,
      parentId: comment.parentId
    });
  }
}
