import UserRoute from "@src/features/routes/UserRoute";
import Campaigns, { CampaignObject } from "@src/features/db/class/Campaigns";
import PageAccess from "@src/features/db/class/PageAccess";

/** OPENAPI-CLASS: get-users-me-campaigns-campaignId-compatible-devices */

type DeviceType =
  StoplightOperations["get-users-me-campaigns-campaignId-compatible-devices"]["responses"]["200"]["content"]["application/json"][0];

class RouteItem extends UserRoute<{
  parameters: StoplightOperations["get-users-me-campaigns-campaignId-compatible-devices"]["parameters"]["path"];
  response: StoplightOperations["get-users-me-campaigns-campaignId-compatible-devices"]["responses"]["200"]["content"]["application/json"];
}> {
  private campaign_id: number;
  private db: { campaigns: Campaigns; page_access: PageAccess };
  private campaign: CampaignObject | undefined;

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    this.db = { campaigns: new Campaigns(), page_access: new PageAccess() };
    this.campaign_id = parseInt(this.getParameters().campaign);
  }
  protected async filter() {
    try {
      await this.getCampaign();
    } catch {
      return this.setUnauthorized();
    }
    if ((await this.candidatureIsAvailable()) === false) {
      return this.setUnauthorized();
    }
    if ((await this.userCanAccessToForm()) === false) {
      return this.setUnauthorized();
    }

    return true;
  }

  private setUnauthorized() {
    this.setError(
      403,
      new Error("You cannot access to this campaign") as OpenapiError
    );
    return false;
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

    return (await this.getCampaign()).start_date >= today;
  }
  private async userCanAccessToForm() {
    return (await this.getCampaign()).testerHasAccess(this.getTesterId());
  }
  private async getCampaign() {
    if (!this.campaign) {
      this.campaign = await this.db.campaigns.get(this.campaign_id);
    }
    return this.campaign;
  }
}

export default RouteItem;
