import { tryber } from "@src/features/database";
import { WebhookTrigger } from "@src/features/webhookTrigger";

class StatusChangeHandler {
  private oldPhase: number = 0;
  private newPhase: number;
  private campaignId: number;
  private creator: number;

  constructor({
    oldPhase,
    newPhase,
    campaignId,
    creator,
  }: {
    oldPhase: number;
    newPhase: number;
    campaignId: number;
    creator: number;
  }) {
    this.oldPhase = oldPhase;
    this.newPhase = newPhase;
    this.campaignId = campaignId;
    this.creator = creator;
  }

  public async run() {
    const type = await tryber.tables.CampaignPhaseType.do()
      .select(tryber.ref("name").withSchema("campaign_phase_type"))
      .join(
        "campaign_phase",
        "campaign_phase.type_id",
        "campaign_phase_type.id"
      )
      .where("campaign_phase.id", this.newPhase)
      .first();
    if (!type) return;

    await this.handleStatusChange(type.name);

    await this.legacySetStatusDetails();

    await this.saveHistory();
    console.log("Status changed from", this.oldPhase, "to", this.newPhase);
  }

  private async saveHistory() {
    await tryber.tables.CampaignPhaseHistory.do().insert({
      phase_id: this.newPhase,
      campaign_id: this.campaignId,
      created_by: this.creator,
    });
  }

  private async handleStatusChange(type: string) {
    if (type === "closed") {
      await tryber.tables.WpAppqEvdCampaign.do()
        .update({ status_id: 2, close_date: tryber.fn.now() })
        .where("id", this.campaignId);
    } else {
      await tryber.tables.WpAppqEvdCampaign.do()
        .update({ status_id: 1 })
        .where("id", this.campaignId);
    }

    await this.triggerWebhook();
  }
  private async legacySetStatusDetails() {
    const phase = await tryber.tables.CampaignPhase.do()
      .select("status_details")
      .where("id", this.newPhase)
      .first();

    if (!phase || !phase.status_details) return;

    await tryber.tables.WpAppqEvdCampaign.do()
      .update({ status_details: phase.status_details })
      .where("id", this.campaignId);
  }

  private async triggerWebhook() {
    const webhook = new WebhookTrigger({
      type: "status_change",
      data: {
        campaignId: this.campaignId,
        oldPhase: this.oldPhase,
        newPhase: this.newPhase,
      },
    });

    await webhook.trigger();
  }
}

export { StatusChangeHandler };
