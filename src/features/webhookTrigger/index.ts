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
      this.webhookUrl = process.env.STATUS_CHANGE_WEBHOOK || "";
    } else if (type === "campaign_created") {
      this.webhookUrl = process.env.CAMPAIGN_CREATION_WEBHOOK || "";
    } else {
      throw new Error("Invalid webhook type");
    }

    this.data = data;
  }

  async trigger() {
    try {
      await axios.post(this.webhookUrl, {
        ...this.data,
        environment: process.env.ENVIROMENT,
      });
    } catch (e) {
      console.error("Error triggering webhook", e);
      throw e;
    }
  }
}
