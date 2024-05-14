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

export type WebhookTypes = StatusChangeWebhook | CampaignCreatedWebhook;

export interface iWebhookTrigger {
  trigger(): Promise<void>;
}
