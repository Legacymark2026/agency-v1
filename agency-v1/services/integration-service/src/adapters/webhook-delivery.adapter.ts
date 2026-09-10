import { IWebhookDeliveryPort } from "../core/ports/integration.ports";
export class WebhookDeliveryAdapter implements IWebhookDeliveryPort {
  public async sendPost(url: string, body: string, signature: string): Promise<boolean> { return true; }
}
