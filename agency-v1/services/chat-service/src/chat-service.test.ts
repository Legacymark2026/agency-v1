import { describe, it, expect, vi, beforeEach } from "vitest";
import { ChatUseCases } from "./core/usecases/chat.usecases";
import { IChatPersistencePort, IRealtimePubSubPort } from "./core/ports/chat.ports";
import { ChatChannelDomain, ChatMessageDomain } from "./core/domain/chat.domain";

describe("Chat Hexagonal Core & Multi-tenant Boundary Unit Tests", () => {
  let mockPersistence: IChatPersistencePort;
  let mockPubSub: IRealtimePubSubPort;
  let useCases: ChatUseCases;

  const tenantA = "company-tenant-alpha";
  const tenantB = "company-tenant-beta";
  const channel1 = "channel-dev-1";

  beforeEach(() => {
    mockPersistence = {
      saveMessage: vi.fn().mockImplementation(async (msg) => ({
        id: "msg-uuid-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        isEdited: false,
        ...msg
      })),
      findMessagesByChannel: vi.fn().mockResolvedValue([]),
      createChannel: vi.fn().mockImplementation(async (c) => ({
        id: "channel-uuid-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        isArchived: false,
        ...c
      })),
      findChannelsForUser: vi.fn().mockResolvedValue([]),
      isUserMemberOfChannel: vi.fn()
    };

    mockPubSub = {
      publishChannelEvent: vi.fn().mockResolvedValue(undefined),
      subscribeToTenant: vi.fn().mockResolvedValue(undefined),
      setPresence: vi.fn().mockResolvedValue(undefined),
      getPresence: vi.fn().mockResolvedValue(null),
      setTyping: vi.fn().mockResolvedValue(undefined)
    };

    useCases = new ChatUseCases(mockPersistence, mockPubSub);
  });

  it("sends message and broadcasts through Redis pubsub when user belongs to channel", async () => {
    vi.mocked(mockPersistence.isUserMemberOfChannel).mockResolvedValue(true);

    const message = await useCases.sendMessage({
      companyId: tenantA,
      channelId: channel1,
      senderId: "user-1",
      senderName: "Alice Dev",
      content: "Hello team, deployment is ready!"
    });

    expect(message.id).toBe("msg-uuid-1");
    expect(message.companyId).toBe(tenantA);
    expect(mockPersistence.saveMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: tenantA,
        channelId: channel1,
        content: "Hello team, deployment is ready!"
      })
    );
    expect(mockPubSub.publishChannelEvent).toHaveBeenCalledWith(
      tenantA,
      channel1,
      expect.objectContaining({
        event: "message.created",
        tenantId: tenantA
      })
    );
  });

  it("strictly enforces multi-tenant boundary: rejects message if user is NOT in tenant/channel", async () => {
    vi.mocked(mockPersistence.isUserMemberOfChannel).mockResolvedValue(false);

    await expect(
      useCases.sendMessage({
        companyId: tenantB,
        channelId: channel1,
        senderId: "user-intruder",
        senderName: "Mallory",
        content: "Breaching tenant boundary"
      })
    ).rejects.toThrow("Unauthorized: User does not belong to this channel or company.");

    expect(mockPersistence.saveMessage).not.toHaveBeenCalled();
    expect(mockPubSub.publishChannelEvent).not.toHaveBeenCalled();
  });

  it("creates corporate channel and assigns creator as member", async () => {
    const channel = await useCases.createChannel({
      companyId: tenantA,
      name: "Engineering General",
      description: "Discusión técnica",
      type: "PUBLIC",
      createdById: "user-admin-1",
      memberIds: ["user-2"]
    });

    expect(channel.name).toBe("Engineering General");
    expect(mockPersistence.createChannel).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: tenantA,
        name: "Engineering General"
      }),
      expect.arrayContaining(["user-2", "user-admin-1"])
    );
  });

  it("broadcasts user presence status to tenant room in Redis", async () => {
    await useCases.setUserPresence(tenantA, "user-1", "ONLINE");

    expect(mockPubSub.setPresence).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: tenantA,
        userId: "user-1",
        status: "ONLINE"
      })
    );
  });
});
