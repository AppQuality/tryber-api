/** OPENAPI-CLASS: post-dossiers-campaign-manual */

import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";
import UserRoute from "@src/features/routes/UserRoute";

export default class RouteItem extends UserRoute<{
  response: StoplightOperations["post-dossiers-campaign-manual"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["post-dossiers-campaign-manual"]["parameters"]["path"];
  body: StoplightOperations["post-dossiers-campaign-manual"]["requestBody"]["content"]["application/json"];
}> {
  private campaignId: number;
  private accessibleCampaigns: true | number[] = this.campaignOlps
    ? this.campaignOlps
    : [];
  private _campaign?: { id: number };

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    this.campaignId = Number(this.getParameters().campaign);
  }

  get campaign() {
    if (!this._campaign) throw new Error("Campaign not loaded");
    return this._campaign;
  }

  protected async init() {
    this._campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select("id")
      .where("id", this.campaignId)
      .first();
  }

  protected async filter() {
    if (!(await super.filter())) return false;

    if (
      (await this.doesNotHaveAccess()) ||
      (await this.campaignDoesNotExists())
    ) {
      this.setError(403, new OpenapiError("You are not authorized to do this"));
      return false;
    }

    return true;
  }

  private async doesNotHaveAccess() {
    if (this.accessibleCampaigns === true) return false;
    if (Array.isArray(this.accessibleCampaigns))
      return !this.accessibleCampaigns.includes(this.campaignId);
    return true;
  }

  private async campaignDoesNotExists() {
    try {
      this.campaign;
      return false;
    } catch (error) {
      return true;
    }
  }

  protected async prepare() {
    this.setSuccess(200, {});
  }
}
