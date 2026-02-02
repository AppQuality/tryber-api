/** OPENAPI-CLASS: post-campaigns-campaign-finance-otherCosts */

import CampaignRoute from "@src/features/routes/CampaignRoute";
import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";

export default class OtherCostsPostRoute extends CampaignRoute<{
  response: StoplightOperations["post-campaigns-campaign-finance-otherCosts"]["responses"]["201"];
  parameters: StoplightOperations["post-campaigns-campaign-finance-otherCosts"]["parameters"]["path"];
  body: StoplightOperations["post-campaigns-campaign-finance-otherCosts"]["requestBody"]["content"]["application/json"];
}> {
  protected async filter(): Promise<boolean> {
    if (!(await super.filter())) return false;

    if (!this.hasAccessToCampaign(this.cp_id)) {
      this.setError(403, new OpenapiError("Access denied"));
      return false;
    }

    const body = this.getBody();

    // Validate description
    if (!body.description || body.description.trim() === "") {
      this.setError(400, new OpenapiError("Description should not be empty"));
      return false;
    }

    // Validate cost
    if (body.cost <= 0) {
      this.setError(400, new OpenapiError("Cost must be greater than 0"));
      return false;
    }

    // Validate type_id exists
    if (!(await this.typeExists(body.type_id))) {
      this.setError(400, new OpenapiError("Type not found"));
      return false;
    }

    // Validate supplier_id exists
    if (!(await this.supplierExists(body.supplier_id))) {
      this.setError(400, new OpenapiError("Supplier not found"));
      return false;
    }

    // Validate attachments
    if (!body.attachments || body.attachments.length === 0) {
      this.setError(
        400,
        new OpenapiError("At least one attachment is required")
      );
      return false;
    }

    for (const attachment of body.attachments) {
      if (!attachment.url || attachment.url.trim() === "") {
        this.setError(400, new OpenapiError("Attachment URL is required"));
        return false;
      }
      if (!attachment.mime_type || attachment.mime_type.trim() === "") {
        this.setError(
          400,
          new OpenapiError("Attachment mime_type is required")
        );
        return false;
      }
    }

    return true;
  }

  protected async prepare(): Promise<void> {
    try {
      const body = this.getBody();
      const costId = await this.createOtherCost(body);
      await this.createAttachments(costId, body.attachments);

      return this.setSuccess(201, undefined);
    } catch (e) {
      console.error("Error creating other cost: ", e);
      return this.setError(500, new OpenapiError("Error creating other cost"));
    }
  }

  private async createOtherCost(
    body: StoplightOperations["post-campaigns-campaign-finance-otherCosts"]["requestBody"]["content"]["application/json"]
  ): Promise<number> {
    const result = await tryber.tables.WpAppqCampaignOtherCosts.do()
      .insert({
        campaign_id: this.cp_id,
        description: body.description,
        cost: body.cost,
        type_id: body.type_id,
        supplier_id: body.supplier_id,
      })
      .returning("id");

    const id = result[0]?.id ?? result[0];

    if (!id) throw new Error("Error creating other cost");

    return id;
  }

  private async createAttachments(
    costId: number,
    attachments: { url: string; mime_type: string }[]
  ): Promise<void> {
    const attachmentsData = attachments.map((attachment) => ({
      cost_id: costId,
      url: attachment.url,
      mime_type: attachment.mime_type,
    }));

    await tryber.tables.WpAppqCampaignOtherCostsAttachment.do().insert(
      attachmentsData
    );
  }

  private async typeExists(typeId: number): Promise<boolean> {
    const type = await tryber.tables.WpAppqCampaignOtherCostsType.do()
      .where({ id: typeId })
      .first();
    return type !== undefined;
  }

  private async supplierExists(supplierId: number): Promise<boolean> {
    const supplier = await tryber.tables.WpAppqCampaignOtherCostsSupplier.do()
      .where({ id: supplierId })
      .first();
    return supplier !== undefined;
  }
}
