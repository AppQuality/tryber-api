import { tryber } from "@src/features/database";

class StatusChangeHandler {
  private oldPhase: number = 0;
  private newPhase: number;
  private campaignId: number;
  private creator: number;

  constructor({
    newPhase,
    campaignId,
    creator,
  }: {
    newPhase: number;
    campaignId: number;
    creator: number;
  }) {
    this.newPhase = newPhase;
    this.campaignId = campaignId;
    this.creator = creator;
  }

  public async run() {
    this.oldPhase = await this.getOldPhase();

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

    await this.saveHistory();
    console.log("Status changed from", this.oldPhase, "to", this.newPhase);
  }

  private async getOldPhase() {
    const oldPhase = await tryber.tables.WpAppqEvdCampaign.do()
      .select("phase_id")
      .where("id", this.campaignId)
      .first();
    if (!oldPhase || !oldPhase.phase_id) throw new Error("Old phase not found");
    return oldPhase.phase_id;
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
  }
}

export { StatusChangeHandler };
