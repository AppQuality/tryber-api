/** OPENAPI-CLASS: get-campaigns-campaign-prospect */
import CampaignRoute from "@src/features/routes/CampaignRoute";
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
    return true;
  }

  protected async prepare(): Promise<void> {
    let prospectRows;
    try {
      prospectRows = [{}];
    } catch (e: any) {
      return this.setError(500, {
        message: e.message || "There was an error while fetching bugs",
        status_code: 500,
      } as OpenapiError);
    }

    if (!prospectRows || !prospectRows.length) return this.setSuccess(200, {});

    return this.setSuccess(200, {});
  }
}
