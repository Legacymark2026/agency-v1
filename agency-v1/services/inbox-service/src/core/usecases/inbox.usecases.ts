/**
 * Inbox Service — Pure Hexagonal Use Cases Orchestration
 * ─────────────────────────────────────────────────────────────────────────────
 */
import {
  IInboxUseCases,
  IInboxRepositoryPort,
  IChannelDispatcherPort,
  IInboxEventPublisherPort,
  SendMessageDTO,
  IncomingMessageDTO,
} from "../ports/inbox.ports";
import {
  ConversationDomain,
  MessageDomain,
  evaluateSLAStatus,
  SLAStatus,
  SLAConfigDomain,
} from "../domain/inbox.domain";

export class InboxUseCases implements IInboxUseCases {
  constructor(
    private readonly repoPort: IInboxRepositoryPort,
    private readonly channelDispatcher: IChannelDispatcherPort,
    private readonly eventPublisher: IInboxEventPublisherPort
  ) {}

  public async receiveIncoming(
    dto: IncomingMessageDTO
  ): Promise<{ conversation: ConversationDomain; message: MessageDomain }> {
    const conv = await this.repoPort.findOrCreateConversation(
      dto.companyId,
      dto.channel,
      dto.senderPhoneOrId
    );

    const message = new MessageDomain(
      "msg_" + Math.random().toString(36).substring(2, 9),
      conv.id,
      dto.senderPhoneOrId,
      "INBOUND",
      dto.content,
      dto.mediaUrl,
      new Date()
    );

    await this.repoPort.saveMessage(message);
    const updatedConv = await this.repoPort.saveConversation(conv.touch(message.createdAt));

    await this.eventPublisher.publishInboxEvent("inbox.message.received", {
      messageId: message.id,
      conversationId: updatedConv.id,
      channel: dto.channel,
      sender: dto.senderPhoneOrId,
    });

    return { conversation: updatedConv, message };
  }

  public async replyMessage(dto: SendMessageDTO): Promise<MessageDomain> {
    const conv = await this.repoPort.findConversationById(dto.conversationId);
    if (!conv) throw new Error(`Conversación ${dto.conversationId} no encontrada`);

    const message = new MessageDomain(
      "msg_" + Math.random().toString(36).substring(2, 9),
      conv.id,
      dto.senderId,
      "OUTBOUND",
      dto.content,
      dto.mediaUrl,
      new Date()
    );

    await this.repoPort.saveMessage(message);

    await this.channelDispatcher.dispatch(
      conv.channel,
      conv.participantId,
      dto.content,
      dto.mediaUrl
    );

    await this.eventPublisher.publishInboxEvent("inbox.message.sent", {
      messageId: message.id,
      conversationId: conv.id,
      channel: conv.channel,
    });

    return message;
  }

  public async getConversationSLA(
    conversationId: string,
    config?: SLAConfigDomain
  ): Promise<{ status: SLAStatus; elapsedMinutes: number }> {
    const conv = await this.repoPort.findConversationById(conversationId);
    if (!conv) throw new Error(`Conversación ${conversationId} no encontrada`);

    return evaluateSLAStatus(conv.lastMessageAt, config);
  }
}
