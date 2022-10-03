import UserRoute from "@src/features/routes/UserRoute";
import Campaigns, { CampaignObject } from "@src/features/db/class/Campaigns";
import TesterDevices, {
  TesterDeviceObject,
} from "@src/features/db/class/TesterDevices";

/** OPENAPI-CLASS: get-users-me-campaigns-campaignId-compatible-devices */

class RouteItem extends UserRoute<{
  parameters: StoplightOperations["get-users-me-campaigns-campaignId-compatible-devices"]["parameters"]["path"];
  response: StoplightOperations["get-users-me-campaigns-campaignId-compatible-devices"]["responses"]["200"]["content"]["application/json"];
}> {
  private campaign_id: number;
  private db: { campaigns: Campaigns; testerDevices: TesterDevices };
  private campaign: CampaignObject | undefined;
  private devices: TesterDeviceObject[] | undefined;

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    this.db = {
      campaigns: new Campaigns(),
      testerDevices: new TesterDevices(),
    };
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
    if ((await this.getCompatibleDevices()).length === 0) {
      this.setError(
        404,
        new Error("There are no compatible devices") as OpenapiError
      );
      return false;
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
    return (await this.getCampaign()).isApplicationAvailable();
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
  private async getCompatibleDevices() {
    if (!this.devices) {
      const where: Parameters<
        typeof this.db.testerDevices.query
      >[number]["where"] = [{ id_profile: this.getTesterId() }];

      const campaign = await this.getCampaign();
      if (campaign.acceptedOs.length > 0) {
        where.push({
          platform_id: campaign.acceptedOs,
        });
      }
      this.devices = await this.db.testerDevices.query({
        where,
      });
    }
    return this.devices;
  }
}

export default RouteItem;
