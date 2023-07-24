/** OPENAPI-CLASS: get-campaigns-campaign-observations */

import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";
import CampaignRoute from "@src/features/routes/CampaignRoute";
export default class SingleCampaignRoute extends CampaignRoute<{
  response: StoplightOperations["get-campaigns-campaign-observations"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-campaigns-campaign-observations"]["parameters"]["path"];
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
      items: await this.getObeservations(),
    });
  }

  private async getObeservations() {
    const obeservations =
      await tryber.tables.WpAppqUsecaseMediaObservations.do()
        .select(
          tryber.ref("id").withSchema("wp_appq_usecase_media_observations"),
          tryber.ref("name").withSchema("wp_appq_usecase_media_observations"),
          tryber
            .ref("video_ts")
            .withSchema("wp_appq_usecase_media_observations")
            .as("time"),
          tryber
            .ref("id")
            .withSchema("wp_appq_usecase_cluster")
            .as("cluster_id"),
          tryber
            .ref("title")
            .withSchema("wp_appq_usecase_cluster")
            .as("cluster_title")
        )
        .join(
          "wp_appq_user_task_media",
          "wp_appq_usecase_media_observations.media_id",
          "wp_appq_user_task_media.id"
        )
        .join(
          "wp_appq_campaign_task",
          "wp_appq_user_task_media.campaign_task_id",
          "wp_appq_campaign_task.id"
        )
        .join(
          "wp_appq_usecase_cluster",
          "wp_appq_campaign_task.cluster_id",
          "wp_appq_usecase_cluster.id"
        )
        .where("wp_appq_campaign_task.campaign_id", this.cp_id);
    if (obeservations === undefined) return [];
    return obeservations.map((obeservation) => ({
      id: obeservation.id,
      name: obeservation.name,
      time: obeservation.time,
      cluster: {
        id: obeservation.cluster_id,
        name: obeservation.cluster_title,
      },
      tester: { id: 0, name: "name" },
    }));
  }
}
