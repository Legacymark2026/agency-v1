import { describe, it, expect, vi, beforeEach } from "vitest";
import { FeedUseCases } from "./core/usecases/feed.usecases";
import { IFeedRepositoryPort, IFeedEventPublisherPort } from "./core/ports/feed.ports";
import { EnterprisePostDomain } from "./core/domain/feed.domain";

describe("Enterprise Feed Hexagonal Core & Multi-tenant Boundary Unit Tests", () => {
  let mockRepo: IFeedRepositoryPort;
  let mockPublisher: IFeedEventPublisherPort;
  let useCases: FeedUseCases;

  const tenantA = "company-tenant-alpha";
  const tenantB = "company-tenant-beta";

  beforeEach(() => {
    mockRepo = {
      savePost: vi.fn().mockImplementation(async (p) => ({
        id: "post-uuid-1",
        viewCount: 0,
        isLocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...p
      })),
      findFeedPosts: vi.fn().mockResolvedValue([]),
      findPostById: vi.fn(),
      saveComment: vi.fn().mockImplementation(async (c) => ({
        id: "comment-uuid-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        ...c
      })),
      findCommentsByPost: vi.fn().mockResolvedValue([]),
      toggleReaction: vi.fn().mockResolvedValue({ reacted: true, type: "LIKE" }),
      deletePostById: vi.fn().mockResolvedValue(undefined),
      incrementViewCount: vi.fn().mockResolvedValue(undefined)
    };

    mockPublisher = {
      publishPostCreated: vi.fn().mockResolvedValue(undefined),
      publishReactionAdded: vi.fn().mockResolvedValue(undefined),
      publishCommentAdded: vi.fn().mockResolvedValue(undefined)
    };

    useCases = new FeedUseCases(mockRepo, mockPublisher);
  });

  it("creates enterprise post and dispatches asynchronous domain event", async () => {
    const post = await useCases.createPost({
      companyId: tenantA,
      authorId: "user-ceo-1",
      authorName: "CEO Carlos",
      title: "Resultados Q3 y Nueva Estrategia",
      content: "Felicitaciones a todos por el excelente desempeño.",
      audienceScope: "COMPANY_WIDE",
      tags: ["anuncio", "estrategia"]
    });

    expect(post.id).toBe("post-uuid-1");
    expect(post.companyId).toBe(tenantA);
    expect(mockRepo.savePost).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: tenantA,
        authorName: "CEO Carlos",
        audienceScope: "COMPANY_WIDE"
      })
    );
    expect(mockPublisher.publishPostCreated).toHaveBeenCalledWith(post);
  });

  it("adds nested comment and verifies post belongs to same tenant", async () => {
    vi.mocked(mockRepo.findPostById).mockResolvedValue({
      id: "post-uuid-1",
      companyId: tenantA,
      authorId: "user-1",
      authorName: "Alice",
      content: "Post content",
      mediaUrls: [],
      audienceScope: "COMPANY_WIDE",
      tags: [],
      isPinned: false,
      isLocked: false,
      viewCount: 10,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const comment = await useCases.addComment({
      companyId: tenantA,
      postId: "post-uuid-1",
      authorId: "user-2",
      authorName: "Bob",
      content: "Excelente iniciativa!"
    });

    expect(comment.id).toBe("comment-uuid-1");
    expect(comment.authorName).toBe("Bob");
    expect(mockPublisher.publishCommentAdded).toHaveBeenCalledWith(comment);
  });

  it("blocks commenting if post is from another tenant or locked", async () => {
    // Post not found in tenant B
    vi.mocked(mockRepo.findPostById).mockResolvedValue(null);

    await expect(
      useCases.addComment({
        companyId: tenantB,
        postId: "post-uuid-1",
        authorId: "user-intruder",
        authorName: "Mallory",
        content: "Breaching tenant"
      })
    ).rejects.toThrow("Cannot comment on non-existent post.");
  });

  it("toggles reaction on enterprise post", async () => {
    vi.mocked(mockRepo.findPostById).mockResolvedValue({
      id: "post-uuid-1",
      companyId: tenantA,
      authorId: "user-1",
      authorName: "Alice",
      content: "Post content",
      mediaUrls: [],
      audienceScope: "COMPANY_WIDE",
      tags: [],
      isPinned: false,
      isLocked: false,
      viewCount: 10,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const reaction = await useCases.toggleReaction({
      companyId: tenantA,
      postId: "post-uuid-1",
      userId: "user-2",
      type: "CELEBRATE"
    });

    expect(reaction.reacted).toBe(true);
    expect(mockRepo.toggleReaction).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: tenantA,
        postId: "post-uuid-1",
        userId: "user-2",
        type: "CELEBRATE"
      })
    );
  });
});
