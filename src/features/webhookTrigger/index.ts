import axios from "axios";

type StatusChangeWebhook = {
  type: "status_change";
  data: {
    campaignId: number;
    newPhase: number;
    oldPhase: number;
  };
};

type CampaignCreatedWebhook = {
  type: "campaign_created";
  data: {
    campaignId: number;
  };
};

type WebhookTypes = StatusChangeWebhook | CampaignCreatedWebhook;

export class WebhookTrigger<T extends WebhookTypes["type"]> {
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
