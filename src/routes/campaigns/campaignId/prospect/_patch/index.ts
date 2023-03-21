/** OPENAPI-CLASS: patch-campaigns-campaign-prospect */
import CampaignRoute from "@src/features/routes/CampaignRoute";
import { tryber } from "@src/features/database";
import GetProspectRoute from "@src/routes/campaigns/campaignId/prospect/_get";
import OpenapiError from "@src/features/OpenapiError";
export default class ProspectRoute extends CampaignRoute<{
  response: StoplightOperations["patch-campaigns-campaign-prospect"]["responses"]["200"];
  parameters: StoplightOperations["patch-campaigns-campaign-prospect"]["parameters"]["path"];
  body: StoplightOperations["patch-campaigns-campaign-prospect"]["requestBody"]["content"]["application/json"];
}> {
  private prospectData:
    | StoplightOperations["get-campaigns-campaign-prospect"]["responses"]["200"]["content"]["application/json"]
    | undefined;

  protected async init(): Promise<void> {
    await super.init();
    const getProspectRoute = new GetProspectRoute(this.configuration);
    try {
      const prospectData = await getProspectRoute.getResolvedData();
      if (prospectData && "items" in prospectData) {
        this.prospectData = prospectData;
      }
    } catch {}
  }

  get prospect() {
    if (typeof this.prospectData === "undefined")
      throw new Error("Invalid prospect data");
    return this.prospectData;
  }

  protected async filter(): Promise<boolean> {
    if (!(await super.filter())) return false;
    if (
      !this.hasAccessTesterSelection(this.cp_id) ||
      !this.hasAccessToProspect(this.cp_id)
    ) {
      this.setError(403, new OpenapiError("Access denied"));

      return false;
    }
    if (await this.thereIsAnExpAttribution()) {
      this.setError(304, new OpenapiError("Prospect delivery already started"));
      return false;
    }
    return true;
  }

  private async thereIsAnExpAttribution() {
    const payoutsModified = await tryber.tables.WpAppqExpPoints.do()
      .select("id")
      .where({ campaign_id: this.cp_id })
      .whereLike("reason", "%Campaign successfully completed%");
    return payoutsModified.length > 0;
  }

  protected async prepare(): Promise<void> {
    console.log(this.prospect);
    return this.setSuccess(200, {});
  }
}
