/** OPENAPI-CLASS: get-campaigns-campaign-stats */
import AdminCampaignRoute from "@src/features/routes/AdminCampaignRoute";
import { tryber } from "@src/features/database";

export default class BugsRoute extends AdminCampaignRoute<{
  response: StoplightOperations["get-campaigns-campaign-stats"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-campaigns-campaign-stats"]["parameters"]["path"];
  query: StoplightOperations["get-campaigns-campaign-stats"]["parameters"]["query"];
}> {
  constructor(configuration: RouteClassConfiguration) {
    super(configuration);

    const query = this.getQuery();
  }
  protected async prepare(): Promise<void> {
    let stats;
    try {
      stats = await this.getStats();
    } catch (e: any) {
      return this.setError(500, {
        message:
          e.message || "There was an error while fetching campaign stats",
        status_code: 500,
      } as OpenapiError);
    }

    return this.setSuccess(200, stats);
  }

  private async getStats() {
    return { selected: 10 };
  }
}
