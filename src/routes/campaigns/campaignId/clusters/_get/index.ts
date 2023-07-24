/** OPENAPI-CLASS: get-campaigns-campaign-clusters */

import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";
import CampaignRoute from "@src/features/routes/CampaignRoute";
export default class SingleCampaignRoute extends CampaignRoute<{
  response: StoplightOperations["get-campaigns-campaign-clusters"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-campaigns-campaign-clusters"]["parameters"]["path"];
}> {
  protected async filter(): Promise<boolean> {
    if (!(await super.filter())) return false;

    if (!this.hasAccessToCampaign(this.cp_id)) {
      this.setError(403, new OpenapiError("Access denied"));
      return false;
    }
    return true;
  }

  protected async prepare(): Promise<void> {
    return this.setSuccess(200, {
      items: await this.getClusters(),
    });
  }

  private async getClusters() {
    const clusters = await tryber.tables.WpAppqUsecaseCluster.do()
      .select(
        tryber.ref("id").withSchema("wp_appq_usecase_cluster"),
        tryber.ref("title").withSchema("wp_appq_usecase_cluster").as("name")
      )
      .join(
        "wp_appq_evd_campaign",
        "wp_appq_usecase_cluster.campaign_id",
        "wp_appq_evd_campaign.id"
      )
      .where("wp_appq_usecase_cluster.campaign_id", this.cp_id);
    if (clusters === undefined) return [];
    return clusters.map((cluster) => ({
      id: cluster.id,
      name: cluster.name,
    }));
  }
}
