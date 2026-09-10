/**
 * Automation Service — Action Dispatcher Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { IActionDispatcherPort } from "../core/ports/automation.ports";

export class ActionDispatcherAdapter implements IActionDispatcherPort {
  public async dispatchAction(actionType: string, config: Record<string, any>, context: Record<string, any>): Promise<boolean> {
    return true;
  }
}
