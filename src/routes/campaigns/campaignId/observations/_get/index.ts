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
      await tryber.tables.WpAppqUsecaseMediaObservations.do().select(
        "id",
        "name",
        tryber.ref("video_ts").as("time")
      );
    if (obeservations === undefined) return [];
    return obeservations.map((obeservation) => {
      return {
        id: obeservation.id,
        name: obeservation.name,
        time: obeservation.time,
        tester: { id: 0, name: "name" },
        cluster: { id: 0, name: "name" },
      };
    });
  }
}
