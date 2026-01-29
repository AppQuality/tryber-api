/** OPENAPI-CLASS: get-campaigns-campaign-finance-supplier  */

import CampaignRoute from "@src/features/routes/CampaignRoute";
import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";

type Supplier = {
  name: string;
  created_on?: string;
  created_by?: number;
};

export default class SupplierRoute extends CampaignRoute<{
  response: StoplightOperations["get-campaigns-campaign-finance-supplier"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-campaigns-campaign-finance-supplier"]["parameters"]["path"];
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
    const suppliers = await this.getSuppliers();

    return this.setSuccess(200, { items: suppliers });
  }

  private async getSuppliers(): Promise<Supplier[]> {
    return await tryber.tables.WpAppqCampaignOtherCostsSupplier.do().select(
      "name",
      "created_on",
      "created_by"
    );
  }
}
