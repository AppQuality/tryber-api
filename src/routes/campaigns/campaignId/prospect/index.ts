/** OPENAPI-CLASS: get-campaigns-campaign-prospect */
import CampaignRoute from "@src/features/routes/CampaignRoute";
import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";

export default class ProspectRoute extends CampaignRoute<{
  response: StoplightOperations["get-campaigns-campaign-prospect"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-campaigns-campaign-prospect"]["parameters"]["path"];
}> {
  protected async filter(): Promise<boolean> {
    if (!(await super.filter())) return false;
    if (
      !(await this.hasAccessTesterSelection(this.cp_id)) ||
      !(await this.hasAccessToProspect(this.cp_id))
    ) {
      this.setError(403, new OpenapiError("Access denied"));

      return false;
    }
    if (await this.testerPayoutsWereEdit()) {
      this.setError(412, new OpenapiError("Precondition failed"));

      return false;
    }
    return true;
  }

  protected async prepare(): Promise<void> {
    let prospect;
    try {
      prospect = { items: [] };
    } catch (e: any) {
      return this.setError(500, {
        message: e.message || "There was an error while fetching prospect",
        status_code: 500,
      } as OpenapiError);
    }

    if (!prospect || !prospect.items.length)
      return this.setSuccess(200, { items: [] });

    return this.setSuccess(200, {});
  }

  private async testerPayoutsWereEdit() {
    const bugs = await tryber.tables.WpAppqProspectPayout.do()
      .select("id")
      .where({ campaign_id: this.cp_id })
      .where("is_edit", ">", 0);
    console.log(bugs);
    return bugs.length > 0;
  }
}
