/**
 * Inbox Service — Channel Dispatcher Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { IChannelDispatcherPort } from "../core/ports/inbox.ports";

export class ChannelDispatcherAdapter implements IChannelDispatcherPort {
  public async dispatch(channel: string, recipient: string, text: string, mediaUrl?: string): Promise<boolean> {
    return true;
  }
}
