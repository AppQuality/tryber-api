/** OPENAPI-CLASS: get-campaigns-campaign-finance-type  */

import CampaignRoute from "@src/features/routes/CampaignRoute";
import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";

export default class TypeRoute extends CampaignRoute<{
  response: StoplightOperations["get-campaigns-campaign-finance-type"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-campaigns-campaign-finance-type"]["parameters"]["path"];
}> {
  protected async filter(): Promise<boolean> {
    if (!(await super.filter())) return false;

    if (!this.hasAccessToCampaign(this.cp_id)) {
      this.setError(403, new OpenapiError("Access denied"));

      return false;
    }
    return true;
  }

  protected async prepare(): Promise<void> {
    const types = await this.getTypes();

    return this.setSuccess(200, { items: types });
  }

  private async getTypes() {
    return await tryber.tables.WpAppqCampaignOtherCostsType.do().select("name");
  }
}
