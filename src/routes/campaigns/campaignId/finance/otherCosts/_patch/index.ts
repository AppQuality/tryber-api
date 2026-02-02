/** OPENAPI-CLASS: patch-campaigns-campaign-finance-otherCosts */

import CampaignRoute from "@src/features/routes/CampaignRoute";
import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";
import deleteFromS3 from "@src/features/deleteFromS3";

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

    if (body.cost_id <= 0) {
      this.setError(400, new OpenapiError("cost_id must be a positive number"));
      return false;
    }

    const costExists = await this.costExistsInCampaign(body.cost_id);
    if (!costExists) {
      this.setError(404, new OpenapiError("Cost not found for this campaign"));
      return false;
    }

    const typeExists = await this.typeExists(body.type_id);
    if (!typeExists) {
      this.setError(404, new OpenapiError("Type not found"));
      return false;
    }

    // Validate supplier: either supplier_id OR new_supplier_name, but not both
    const hasSupplier =
      body.supplier_id !== undefined && body.supplier_id !== null;
    const hasNewSupplierName =
      body.new_supplier_name !== undefined &&
      body.new_supplier_name !== null &&
      body.new_supplier_name.trim() !== "";

    if (!hasSupplier && !hasNewSupplierName) {
      this.setError(
        400,
        new OpenapiError(
          "Either supplier_id or new_supplier_name must be provided"
        )
      );
      return false;
    }

    if (hasSupplier && hasNewSupplierName) {
      this.setError(
        400,
        new OpenapiError(
          "Cannot provide both supplier_id and new_supplier_name"
        )
      );
      return false;
    }

    if (hasSupplier) {
      const supplierExists = await this.supplierExists(body.supplier_id!);
      if (!supplierExists) {
        this.setError(404, new OpenapiError("Supplier not found"));
        return false;
      }
    }

    return true;
  }

  protected async prepare(): Promise<void> {
    try {
      const body = this.getBody();
      await this.updateOtherCost(body);

      const updatedCost = await this.getUpdatedCost(body.cost_id);

      return this.setSuccess(200, updatedCost);
    } catch (e) {
      console.error("Error updating other cost: ", e);
      return this.setError(500, new OpenapiError("Error updating other cost"));
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

  private async updateOtherCost(
    body: StoplightOperations["patch-campaigns-campaign-finance-otherCosts"]["requestBody"]["content"]["application/json"]
  ): Promise<void> {
    await this.deleteExistingAttachments(body.cost_id);

    let supplierId: number;
    if (body.supplier_id !== undefined && body.supplier_id !== null) {
      supplierId = body.supplier_id;
    } else if (body.new_supplier_name) {
      supplierId = await this.createOrGetSupplier(body.new_supplier_name);
    } else {
      throw new Error("No supplier information provided");
    }

    await tryber.tables.WpAppqCampaignOtherCosts.do()
      .where({ id: body.cost_id })
      .update({
        description: body.description,
        cost: body.cost,
        type_id: body.type_id,
        supplier_id: supplierId,
      });

    if (body.attachments && body.attachments.length > 0) {
      await this.createAttachments(body.cost_id, body.attachments);
    }
  }

  private async createOrGetSupplier(supplierName: string): Promise<number> {
    const existingSupplier =
      await tryber.tables.WpAppqCampaignOtherCostsSupplier.do()
        .where({ name: supplierName })
        .first();

    if (existingSupplier) {
      return existingSupplier.id;
    }

    const result = await tryber.tables.WpAppqCampaignOtherCostsSupplier.do()
      .insert({
        name: supplierName,
        created_by: this.getWordpressId(),
        created_on: tryber.fn.now(),
      })
      .returning("id");

    const id = result[0]?.id ?? result[0];
    if (!id) throw new Error("Error creating supplier");

    return id;
  }

  private async deleteExistingAttachments(costId: number): Promise<void> {
    const attachments =
      await tryber.tables.WpAppqCampaignOtherCostsAttachment.do()
        .select("url", "id")
        .where({ cost_id: costId });

    if (attachments.length > 0) {
      for (const attachment of attachments) {
        try {
          await deleteFromS3({ url: attachment.url });
        } catch (e) {
          console.error(
            `Error deleting attachment from S3: ${attachment.url}`,
            e
          );
          throw new Error("Error deleting attachment from S3");
        }
      }

      await tryber.tables.WpAppqCampaignOtherCostsAttachment.do()
        .where({ cost_id: costId })
        .delete();
    }
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
