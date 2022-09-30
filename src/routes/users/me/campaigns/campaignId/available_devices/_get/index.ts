import * as db from "@src/features/db";
import UserRoute from "@src/features/routes/UserRoute";
import Devices, { UserDevice } from "@src/features/class/Devices";
import Campaigns from "@src/features/db/class/Campaigns";

/** OPENAPI-CLASS: get-users-me-campaigns-campaignId-available-devices */

type DeviceType =
  StoplightOperations["get-users-me-campaigns-campaignId-available-devices"]["responses"]["200"]["content"]["application/json"][0];

class RouteItem extends UserRoute<{
  parameters: StoplightOperations["get-users-me-campaigns-campaignId-available-devices"]["parameters"]["path"];
  response: StoplightOperations["get-users-me-campaigns-campaignId-available-devices"]["responses"]["200"]["content"]["application/json"];
}> {
  private campaign_id: number;
  private db: { campaigns: Campaigns };

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    this.db = { campaigns: new Campaigns() };
    this.campaign_id = parseInt(this.getParameters().campaign);
  }
  protected async filter() {
    if ((await this.candidatureIsAvailable()) === false) {
      this.setError(
        403,
        new Error("Candidature is not available") as OpenapiError
      );
      return false;
    }

    return true;
  }

  protected async prepare() {
    try {
      this.setSuccess(200, []);
    } catch (e) {
      if (process.env && process.env.DEBUG) console.log(e);
      this.setError(500, e as OpenapiError);
    }
  }
  private async candidatureIsAvailable(): Promise<boolean> {
    const today = new Date().toISOString().split("T")[0];
    const currentCampaign = await this.db.campaigns.get(this.campaign_id);

    return currentCampaign.start_date >= today;
  }
}

export default RouteItem;
