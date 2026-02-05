/** OPENAPI-CLASS: post-campaigns-campaign-finance-otherCosts */

import CampaignRoute from "@src/features/routes/CampaignRoute";
import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";

type OtherCostItem = {
  description: string;
  type_id: number;
  supplier_id: number;
  cost: number;
  attachments: { url: string; mime_type: string }[];
};

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

    if (!Array.isArray(body) || body.length === 0) {
      this.setError(
        400,
        new OpenapiError("Body must be a non-empty array of cost items")
      );
      return false;
    }

    for (const item of body) {
      const i = body.indexOf(item);

      if (!item.description || item.description.trim() === "") {
        this.setError(
          400,
          new OpenapiError(`Item ${i + 1}: Description should not be empty`)
        );
        return false;
      }

      if (item.cost <= 0) {
        this.setError(
          400,
          new OpenapiError(`Item ${i + 1}: Cost must be greater than 0`)
        );
        return false;
      }

      if (!(await this.typeExists(item.type_id))) {
        this.setError(400, new OpenapiError(`Item ${i + 1}: Type not found`));
        return false;
      }

      if (!(await this.supplierExists(item.supplier_id))) {
        this.setError(
          400,
          new OpenapiError(`Item ${i + 1}: Supplier not found`)
        );
        return false;
      }

      if (!item.attachments || item.attachments.length === 0) {
        this.setError(
          400,
          new OpenapiError(`Item ${i + 1}: At least one attachment is required`)
        );
        return false;
      }

      for (const attachment of item.attachments) {
        if (!attachment.url || attachment.url.trim() === "") {
          this.setError(
            400,
            new OpenapiError(`Item ${i + 1}: Attachment URL is required`)
          );
          return false;
        }
        if (!attachment.mime_type || attachment.mime_type.trim() === "") {
          this.setError(
            400,
            new OpenapiError(`Item ${i + 1}: Attachment mime_type is required`)
          );
          return false;
        }
      }
    }

    return true;
  }

  protected async prepare(): Promise<void> {
    try {
      const body = this.getBody();

      for (const item of body) {
        const costId = await this.createOtherCost(item);
        await this.createAttachments(costId, item.attachments);
      }

      return this.setSuccess(201, {});
    } catch (e) {
      console.error("Error creating other costs: ", e);
      return this.setError(500, new OpenapiError("Error creating other costs"));
    }
  }

  private async createOtherCost(item: OtherCostItem): Promise<number> {
    const result = await tryber.tables.WpAppqCampaignOtherCosts.do()
      .insert({
        campaign_id: this.cp_id,
        description: item.description,
        cost: item.cost,
        type_id: item.type_id,
        supplier_id: item.supplier_id,
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
