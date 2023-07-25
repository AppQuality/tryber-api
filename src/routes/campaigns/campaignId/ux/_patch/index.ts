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
    return this.setSuccess(200, {});
  }

  private async addInsights() {
    for (const insight of this.getBody().insights) {
      const data = {
        campaign_id: this.campaignId,
        version: 1,
        title: insight.title ? insight.title : "",
        description: insight.description ? insight.description : "",
        severity_id: insight.severityId ? insight.severityId : 1,
        cluster_ids:
          Array.isArray(insight.clusterIds) && insight.clusterIds.length
            ? insight.clusterIds.join(",")
            : insight.clusterIds === "all"
            ? "0"
            : "0",
        order: insight.order ? insight.order : 1,
      };
      await tryber.tables.UxCampaignInsights.do().insert(data);
    }
  }
}
