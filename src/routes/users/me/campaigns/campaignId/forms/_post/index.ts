import { CampaignObject } from "@src/features/db/class/Campaigns";
import UserRoute from "@src/features/routes/UserRoute";
import Campaigns from "@src/features/db/class/Campaigns";

/** OPENAPI-CLASS: post-users-me-campaigns-campaignId-forms */

class RouteItem extends UserRoute<{
  response: StoplightOperations["post-users-me-campaigns-campaignId-forms"]["responses"]["200"];
  parameters: StoplightOperations["post-users-me-campaigns-campaignId-forms"]["parameters"]["path"];
  body: StoplightOperations["post-users-me-campaigns-campaignId-forms"]["requestBody"]["content"]["application/json"];
}> {
  private campaignId: number;
  private campaign: CampaignObject | false = false;
  private deviceId: number;

  private db: {
    campaigns: Campaigns;
  };

  constructor(options: RouteItem["configuration"]) {
    super(options);
    const parameters = this.getParameters();
    const body = this.getBody();
    this.campaignId = parseInt(parameters.campaignId);
    this.db = {
      campaigns: new Campaigns(),
    };
    this.deviceId = body.device || -1;
  }

  protected async filter() {
    if ((await this.campaignExist()) === false) {
      this.setError(404, new Error("Campaign not found") as OpenapiError);
      return false;
    }
    if ((await this.applicationIsAvailable()) === false) {
      this.setError(403, new Error("Campaign not found") as OpenapiError);
      return false;
    }
    if ((await this.testerCanApply()) === false) {
      this.setError(403, new Error("Campaign not found") as OpenapiError);
      return false;
    }
    if (this.deviceId <= 0) {
      this.setError(406, new Error("Campaign not found") as OpenapiError);
      return false;
    }
    return true;
  }

  private async campaignExist() {
    try {
      await this.getCampaign();
      return true;
    } catch (e) {
      return false;
    }
  }

  private async applicationIsAvailable() {
    return (await this.getCampaign()).isApplicationAvailable();
  }

  private async testerCanApply() {
    return (await this.getCampaign()).testerHasAccess(this.getTesterId());
  }

  private async getCampaign() {
    if (this.campaign === false) {
      this.campaign = await this.db.campaigns.get(this.campaignId);
    }
    return this.campaign;
  }

  protected async prepare(): Promise<void> {
    this.setSuccess(200, {});
  }
}

export default RouteItem;
