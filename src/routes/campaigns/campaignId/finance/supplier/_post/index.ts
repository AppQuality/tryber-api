/** OPENAPI-CLASS: post-campaigns-campaign-finance-supplier  */

import CampaignRoute from "@src/features/routes/CampaignRoute";
import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";

export default class SupplierRoute extends CampaignRoute<{
  response: StoplightOperations["post-campaigns-campaign-finance-supplier"]["responses"]["201"]["content"]["application/json"];
  parameters: StoplightOperations["post-campaigns-campaign-finance-supplier"]["parameters"]["path"];
  body: StoplightOperations["post-campaigns-campaign-finance-supplier"]["requestBody"]["content"]["application/json"];
}> {
  protected async filter(): Promise<boolean> {
    if (!(await super.filter())) return false;

    if (!this.hasAccessToCampaign(this.cp_id)) {
      this.setError(403, new OpenapiError("Access denied"));

      return false;
    }

    if (this.getBody().name.trim() === "") {
      this.setError(400, new OpenapiError("Supplier name should not be empty"));
      return false;
    }

    return true;
  }

  protected async prepare(): Promise<void> {
    if (await this.checkSupplierExists(this.getBody().name)) {
      return this.setError(400, new OpenapiError("Supplier already exists"));
    }

    try {
      const supplierId = await this.createNewSupplier(this.getBody().name);
      return this.setSuccess(201, { supplier_id: supplierId });
    } catch (e) {
      console.error("Error creating new supplier: ", e);
      return this.setError(
        500,
        new OpenapiError("Error creating new supplier")
      );
    }
  }

  private async createNewSupplier(name: string): Promise<number> {
    const result = await tryber.tables.WpAppqCampaignOtherCostsSupplier.do()
      .insert({
        name,
        created_by: this.getTesterId(),
      })
      .returning("id");

    const id = result[0]?.id ?? result[0];

    if (!id) throw new Error("Error creating supplier");

    return id;
  }

  private async checkSupplierExists(name: string): Promise<boolean> {
    const supplier = await tryber.tables.WpAppqCampaignOtherCostsSupplier.do()
      .where({ name })
      .first();
    return supplier !== undefined;
  }
}
