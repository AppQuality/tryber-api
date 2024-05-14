import axios from "axios";
import { WebhookTypes, iWebhookTrigger } from "./types";

export class WebhookTrigger<T extends WebhookTypes["type"]>
  implements iWebhookTrigger
{
  private webhookUrl: string;
  private data: WebhookTypes["data"];

  constructor({
    type,
    data,
  }: {
    type: T;
    data: Extract<WebhookTypes, { type: T }>["data"];
  }) {
    if (type === "status_change") {
      this.webhookUrl = process.env.STATUS_CHANGE_WEBHOOK_URL || "";
    } else if (type === "campaign_created") {
      this.webhookUrl = process.env.CAMPAIGN_CREATED_WEBHOOK_URL || "";
    } else {
      throw new Error("Invalid webhook type");
    }

    this.data = data;
  }

  async trigger() {
    await axios.post(this.webhookUrl, {
      ...this.data,
      environment: process.env.ENVIROMENT,
    });
  }
}
