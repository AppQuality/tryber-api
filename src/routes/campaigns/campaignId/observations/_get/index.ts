/** OPENAPI-CLASS: get-campaigns-campaign-observations */

import OpenapiError from "@src/features/OpenapiError";
import { checkUrl } from "@src/features/checkUrl";
import { tryber } from "@src/features/database";
import CampaignRoute from "@src/features/routes/CampaignRoute";
import { mapToDistribution } from "@src/features/s3/mapToDistribution";
export default class SingleCampaignRoute extends CampaignRoute<{
  response: StoplightOperations["get-campaigns-campaign-observations"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-campaigns-campaign-observations"]["parameters"]["path"];
  query: StoplightOperations["get-campaigns-campaign-observations"]["parameters"]["query"];
}> {
  private filterBy: {
    cluster?: number[];
  } = {};

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    const query = this.getQuery();
    if (query.filterBy) {
      if ((query.filterBy as any).cluster) {
        this.filterBy.cluster = (query.filterBy as any).cluster
          .split(",")
          .map(Number);
      }
    }
  }

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
      items: await this.getObservations(),
    });
  }

  private async getObservations() {
    const query = tryber.tables.WpAppqUsecaseMediaObservations.do()
      .select(
        tryber.ref("id").withSchema("wp_appq_usecase_media_observations"),
        tryber.ref("name").withSchema("wp_appq_usecase_media_observations"),
        tryber
          .ref("video_ts")
          .withSchema("wp_appq_usecase_media_observations")
          .as("time"),
        tryber.ref("id").withSchema("wp_appq_usecase_cluster").as("cluster_id"),
        tryber
          .ref("title")
          .withSchema("wp_appq_usecase_cluster")
          .as("cluster_title"),
        tryber.ref("id").withSchema("wp_appq_evd_profile").as("tester_id"),
        tryber.ref("name").withSchema("wp_appq_evd_profile").as("tester_name"),
        tryber.ref("id").withSchema("wp_appq_user_task_media").as("media_id"),
        tryber
          .ref("location")
          .withSchema("wp_appq_user_task_media")
          .as("media_url")
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
      .join(
        "wp_appq_evd_profile",
        "wp_appq_user_task_media.tester_id",
        "wp_appq_evd_profile.id"
      )
      .where("wp_appq_campaign_task.campaign_id", this.cp_id)
      .where("wp_appq_user_task_media.location", "like", "%.mp4");

    if (this.filterBy.cluster) {
      query.whereIn("wp_appq_usecase_cluster.id", this.filterBy.cluster);
    }

    const observations = await query;
    const results = [];
    for (const observation of observations) {
      const stream = observation.media_url.replace(".mp4", "-stream.m3u8");
      const isValidStream = await checkUrl(stream);
      results.push({
        id: observation.id,
        name: observation.name,
        time: Number(observation.time.toFixed(1)),
        cluster: {
          id: observation.cluster_id,
          name: observation.cluster_title,
        },
        tester: { id: observation.tester_id, name: observation.tester_name },
        media: {
          id: observation.media_id,
          url: mapToDistribution(observation.media_url),
          streamUrl: isValidStream ? mapToDistribution(stream) : "",
        },
      });
    }

    return results;
  }
}
