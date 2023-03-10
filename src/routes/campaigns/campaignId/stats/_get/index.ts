/** OPENAPI-CLASS: get-campaigns-campaign-stats */
import AdminCampaignRoute from "@src/features/routes/AdminCampaignRoute";
import { tryber } from "@src/features/database";

export default class StatsRoute extends AdminCampaignRoute<{
  response: StoplightOperations["get-campaigns-campaign-stats"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-campaigns-campaign-stats"]["parameters"]["path"];
}> {
  protected async prepare(): Promise<void> {
    let stats;
    try {
      stats = { selected: await this.getSelectedTesters() };
    } catch (e: any) {
      return this.setError(500, {
        message:
          e.message || "There was an error while fetching selected testers",
        status_code: 500,
      } as OpenapiError);
    }

    return this.setSuccess(200, stats);
  }

  private async getSelectedTesters() {
    const res = await tryber.tables.WpCrowdAppqHasCandidate.do()
      .count("user_id", { as: "selected" })
      .where({
        campaign_id: this.cp_id,
        accepted: 1,
      })
      .first();
    if (!res) return 0 as const;
    return Number(res.selected);
  }
}
