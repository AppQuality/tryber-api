/** OPENAPI-CLASS: get-dossiers-campaign-humanResources */

import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";
import CampaignRoute from "@src/features/routes/CampaignRoute";

export default class RouteItem extends CampaignRoute<{
  response: StoplightOperations["get-dossiers-campaign-humanResources"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-dossiers-campaign-humanResources"]["parameters"]["path"];
}> {
  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
  }

  protected async filter(): Promise<boolean> {
    if (!(await super.filter())) return false;

    if (!this.hasAccessToCampaign(this.cp_id)) {
      this.setError(403, new OpenapiError("No access to campaign"));
      return false;
    }

    return true;
  }

  protected async prepare(): Promise<void> {
    const humanResources = await tryber.tables.CampaignHumanResources.do()
      .select(
        tryber.ref("id").withSchema("campaign_human_resources"),
        "campaign_id",
        "profile_id",
        "days",
        "work_rate_id",
        tryber.ref("daily_rate").withSchema("work_rates").as("value")
      )
      .join("work_rates", "work_rates.id", "work_rate_id")
      .where({
        campaign_id: this.cp_id,
      });
    this.setSuccess(200, {
      items: humanResources.map((hr) => ({
        id: hr.id,
        assignee: {
          id: hr.profile_id,
        },
        days: hr.days,
        work_rate: {
          id: hr.work_rate_id,
          value: hr.value,
        },
      })),
    });
  }
}
