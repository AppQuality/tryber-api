/** OPENAPI-CLASS: patch-campaigns-campaign-finance-otherCosts */

import CampaignRoute from "@src/features/routes/CampaignRoute";
import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";
import deleteFromS3 from "@src/features/deleteFromS3";

type OtherCostItem = {
  cost_id: number;
  description: string;
  type_id: number;
  supplier_id: number;
  cost: number;
  attachments: { url: string; mime_type: string }[];
};

export default class OtherCostsPatchRoute extends CampaignRoute<{
  response: StoplightOperations["patch-campaigns-campaign-finance-otherCosts"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["patch-campaigns-campaign-finance-otherCosts"]["parameters"]["path"];
  body: StoplightOperations["patch-campaigns-campaign-finance-otherCosts"]["requestBody"]["content"]["application/json"];
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
      if (item.attachments.length === 0) {
        this.setError(
          400,
          new OpenapiError(
            `Item ${item.cost_id}: At least one attachment is required`
          )
        );
        return false;
      }

      if (item.cost_id <= 0) {
        this.setError(
          400,
          new OpenapiError(
            `Item ${item.cost_id}: cost_id must be a positive number`
          )
        );
        return false;
      }

      if (!(await this.costExistsInCampaign(item.cost_id))) {
        this.setError(
          404,
          new OpenapiError(
            `Item ${item.cost_id}: Cost not found for this campaign`
          )
        );
        return false;
      }

      if (!(await this.typeExists(item.type_id))) {
        this.setError(
          404,
          new OpenapiError(`Item ${item.cost_id}: Type not found`)
        );
        return false;
      }

      if (!(await this.supplierExists(item.supplier_id))) {
        this.setError(
          404,
          new OpenapiError(`Item ${item.cost_id}: Supplier not found`)
        );
        return false;
      }
    }

    return true;
  }

  protected async prepare(): Promise<void> {
    try {
      const body = this.getBody();
      const updatedCosts = [];

      for (const item of body) {
        await this.updateOtherCost(item);
        const updatedCost = await this.getUpdatedCost(item.cost_id);
        updatedCosts.push(updatedCost);
      }

      return this.setSuccess(200, updatedCosts);
    } catch (e) {
      console.error("Error updating other costs: ", e);
      return this.setError(500, new OpenapiError("Error updating other costs"));
    }
  }

  private async costExistsInCampaign(costId: number): Promise<boolean> {
    const cost = await tryber.tables.WpAppqCampaignOtherCosts.do()
      .where({ id: costId, campaign_id: this.cp_id })
      .first();
    return cost !== undefined;
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

  private async updateOtherCost(item: OtherCostItem): Promise<void> {
    await this.updateAttachments(item);

    await tryber.tables.WpAppqCampaignOtherCosts.do()
      .where({ id: item.cost_id })
      .update({
        description: item.description,
        cost: item.cost,
        type_id: item.type_id,
        supplier_id: item.supplier_id,
      });
  }

  private async updateAttachments(item: OtherCostItem): Promise<void> {
    const { cost_id, attachments } = item;
    const existingAttachments =
      await tryber.tables.WpAppqCampaignOtherCostsAttachment.do()
        .select("id", "url", "mime_type")
        .where({ cost_id: cost_id });

    const existingUrls = existingAttachments.map((a) => a.url);
    const newUrls = attachments.map((a) => a.url);

    const attachmentsToDelete = existingAttachments.filter(
      (existing) => !newUrls.includes(existing.url)
    );

    if (attachmentsToDelete.length > 0) {
      for (const attachment of attachmentsToDelete) {
        try {
          await deleteFromS3({ url: attachment.url });
          await tryber.tables.WpAppqCampaignOtherCostsAttachment.do()
            .where("id", attachment.id)
            .delete();
        } catch (e) {
          console.error(
            `Error deleting attachment from S3: ${attachment.url}`,
            e
          );
          throw new Error("Error deleting attachment from S3");
        }
      }
    }

    const attachmentsToAdd = attachments.filter(
      (newAttachment) => !existingUrls.includes(newAttachment.url)
    );

    if (attachmentsToAdd.length > 0) {
      const attachmentsData = attachmentsToAdd.map((attachment) => ({
        cost_id: cost_id,
        url: attachment.url,
        mime_type: attachment.mime_type,
      }));

      await tryber.tables.WpAppqCampaignOtherCostsAttachment.do().insert(
        attachmentsData
      );
    }
  }

  private async getUpdatedCost(costId: number) {
    const cost = await tryber.tables.WpAppqCampaignOtherCosts.do()
      .select(
        tryber
          .ref("id")
          .withSchema("wp_appq_campaign_other_costs")
          .as("cost_id"),
        "description",
        "type_id",
        "supplier_id",
        "cost"
      )
      .where({ id: costId })
      .first();

    if (!cost) {
      throw new Error("Cost not found after update");
    }

    const type = await tryber.tables.WpAppqCampaignOtherCostsType.do()
      .select("id", "name")
      .where({ id: cost.type_id })
      .first();

    const supplier = await tryber.tables.WpAppqCampaignOtherCostsSupplier.do()
      .select("id", "name")
      .where({ id: cost.supplier_id })
      .first();

    const attachments =
      await tryber.tables.WpAppqCampaignOtherCostsAttachment.do()
        .select("id", "url", "mime_type")
        .where({ cost_id: costId });

    return {
      description: cost.description,
      type: type?.name || "",
      cost_id: cost.cost_id,
      supplier: supplier?.name || "",
      cost: cost.cost,
      attachments: attachments.map((a) => ({
        url: a.url,
        mime_type: a.mime_type,
      })),
    };
  }
}
