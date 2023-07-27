/** OPENAPI-CLASS: patch-campaigns-campaign-ux */

import OpenapiError from "@src/features/OpenapiError";
import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";
import UxData from "../UxData";

export default class PatchUx extends UserRoute<{
  response: StoplightOperations["patch-campaigns-campaign-ux"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["patch-campaigns-campaign-ux"]["parameters"]["path"];
  body: StoplightOperations["patch-campaigns-campaign-ux"]["requestBody"]["content"]["application/json"];
}> {
  private campaignId: number;
  private lastDraft: UxData | undefined;
  private version: number = 0;

  constructor(config: RouteClassConfiguration) {
    super(config);
    this.campaignId = Number(this.getParameters().campaign);
  }

  protected async init() {
    await super.init();
    this.lastDraft = new UxData(this.campaignId);
    await this.lastDraft.lastDraft();
    this.version = this.lastDraft.version || 0;
  }

  protected async filter() {
    if (!(await this.campaignExists())) {
      return this.setNoAccessError();
    }

    if (!this.hasAccessToCampaign(this.campaignId)) {
      return this.setNoAccessError();
    }

    return true;
  }

  private setNoAccessError() {
    this.setError(
      403,
      new OpenapiError("You don't have access to this campaign")
    );
    return false;
  }

  private async campaignExists() {
    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select("id")
      .where({
        id: this.campaignId,
      })
      .first();
    return !!campaign;
  }

  protected async prepare(): Promise<void> {
    const body = this.getBody();

    if ("status" in body) {
      if (body.status === "publish") {
        await this.publish();
      }
    } else {
      await this.update();
    }

    return this.setSuccess(200, {});
  }

  private async update() {
    const body = this.getBody();
    if ("status" in body) return;

    if (!this.lastDraft?.data) {
      await this.insertFirstVersion();
    }

    await this.updateInsights();
  }

  private async insertFirstVersion() {
    await tryber.tables.UxCampaignData.do().insert({
      campaign_id: this.campaignId,
      version: 1,
      published: 0,
    });
    this.version = 1;
  }

  private async updateInsights() {
    const body = this.getBody();
    if ("status" in body) return;
    const { insights } = body;

    const toUpdate = insights.filter((i) => i.id);
    const currentInsightIds = (this.lastDraft?.findings || []).map((i) => i.id);

    const notFoundIds = toUpdate
      .map((i) => i.id)
      .filter((id) => !currentInsightIds.includes(id as number));

    if (notFoundIds.length) {
      this.setError(500, new OpenapiError("Insight not found"));
      throw new OpenapiError(
        `Insights with id ${notFoundIds.join(", ")} not found`
      );
    }

    await tryber.tables.UxCampaignInsights.do()
      .delete()
      .whereIn(
        "id",
        currentInsightIds.filter(
          (id) => !toUpdate.map((i) => i.id).includes(id as number)
        )
      );

    const toInsert = insights.filter((i) => !i.id);
    if (toInsert.length)
      await tryber.tables.UxCampaignInsights.do().insert(
        toInsert.map((i) => ({
          campaign_id: this.campaignId,
          cluster_ids: i.clusterIds === "all" ? "0" : i.clusterIds.join(","),
          description: i.description,
          order: i.order,
          severity_id: i.severityId,
          title: i.title,
          version: this.version,
        }))
      );

    if (toUpdate.length) {
      for (const item of toUpdate) {
        await tryber.tables.UxCampaignInsights.do()
          .update({
            cluster_ids:
              item.clusterIds === "all" ? "0" : item.clusterIds.join(","),
            description: item.description,
            order: item.order,
            severity_id: item.severityId,
            title: item.title,
            version: this.version,
          })
          .where({
            id: item.id,
          });
      }
    }
  }

  private async publish() {
    const draftData = this.lastDraft?.data;
    if (!draftData) {
      this.setError(400, new OpenapiError("No draft found"));
      throw new OpenapiError("No draft found");
    }

    await this.publishData();
    await this.publishInsight();
    this.version++;
  }

  private async publishData() {
    await tryber.tables.UxCampaignData.do()
      .update({
        published: 1,
      })
      .where({
        campaign_id: this.campaignId,
        version: this.version,
      });

    await tryber.tables.UxCampaignData.do().insert({
      campaign_id: this.campaignId,
      version: this.version + 1,
      published: 0,
    });
  }

  private async publishInsight() {
    const draftData = this.lastDraft?.data;
    if (!draftData) throw new OpenapiError("No draft found");

    let order = 0;
    for (const insight of draftData.findings) {
      await tryber.tables.UxCampaignInsights.do().insert({
        campaign_id: this.campaignId,
        cluster_ids:
          insight.cluster === "all"
            ? "0"
            : insight.cluster.map((c) => c.id).join(","),
        description: insight.description,
        order: order++,
        severity_id: insight.severity.id,
        title: insight.title,
        version: this.version + 1,
      });
    }
  }
}
