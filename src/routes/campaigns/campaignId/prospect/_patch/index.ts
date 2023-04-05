/** OPENAPI-CLASS: patch-campaigns-campaign-prospect */
import OpenapiError from "@src/features/OpenapiError";
import { tryber } from "@src/features/database";
import { send } from "@src/features/mail/send";
import CampaignRoute from "@src/features/routes/CampaignRoute";
export default class ProspectRoute extends CampaignRoute<{
  response: StoplightOperations["patch-campaigns-campaign-prospect"]["responses"]["200"];
  parameters: StoplightOperations["patch-campaigns-campaign-prospect"]["parameters"]["path"];
  body: StoplightOperations["patch-campaigns-campaign-prospect"]["requestBody"]["content"]["application/json"];
}> {
  protected async init(): Promise<void> {
    await super.init();
  }

  get status() {
    const { status } = this.getBody();
    return status;
  }

  protected async filter(): Promise<boolean> {
    if (!(await super.filter())) return false;

    if (!this.hasAccessTesterSelection(this.cp_id)) {
      this.setError(403, new OpenapiError("Access denied"));
      return false;
    }

    if (this.status === undefined) {
      this.setError(304, new OpenapiError("Not Modified"));
      return false;
    }

    if ((await this.getProspect())?.status === this.status) {
      this.setError(304, new OpenapiError("Not Modified"));
      return false;
    }

    if (this.status === "done") {
      this.setError(501, new OpenapiError("Not Implemented"));
      return false;
    }

    return true;
  }

  protected async prepare(): Promise<void> {
    await this.updateProspect();
    return this.setSuccess(200, {});
  }

  private async getProspect() {
    const prospect = await tryber.tables.WpAppqProspect.do()
      .select()
      .where({ campaign_id: this.cp_id })
      .first();
    return prospect;
  }

  private async updateProspect() {
    await tryber.tables.WpAppqProspect.do()
      .insert({
        campaign_id: this.cp_id,
        status: this.status,
      })
      .onConflict("campaign_id")
      .merge(["status"]);
  }
}
