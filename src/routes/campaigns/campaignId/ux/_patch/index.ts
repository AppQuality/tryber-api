/** OPENAPI-CLASS: patch-campaigns-campaign-ux */

import OpenapiError from "@src/features/OpenapiError";
import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";

export default class PatchUx extends UserRoute<{
  response: StoplightOperations["patch-campaigns-campaign-ux"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["patch-campaigns-campaign-ux"]["parameters"]["path"];
  body: StoplightOperations["patch-campaigns-campaign-ux"]["requestBody"]["content"]["application/json"];
}> {
  private campaignId: number;

  constructor(config: RouteClassConfiguration) {
    super(config);
    this.campaignId = Number(this.getParameters().campaign);
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
    await this.addInsights();
    await this.updateUxVersion();
    return this.setSuccess(200, {});
  }

  private async addInsights() {
    for (const insight of this.getBody().insights) {
      const data = {
        campaign_id: this.campaignId,
        version: 1,
        title: insight.title,
        description: insight.description,
        severity_id: insight.severityId,
        cluster_ids: mapClustersForInsert(insight.clusterIds),
        order: insight.order,
      };
      await tryber.tables.UxCampaignInsights.do().insert(data);
    }

    function mapClustersForInsert(clusterIds: "all" | number[]) {
      if (clusterIds === "all") return "0";
      if (Array.isArray(clusterIds) && clusterIds.length > 0)
        return clusterIds.join(",");
      throw new Error("Invalid clusterIds");
    }
  }

  private async updateUxVersion() {
    await tryber.tables.UxCampaignData.do().insert({
      campaign_id: this.campaignId,
      version: 1,
      published: 1,
    });
  }
}
