/** OPENAPI-CLASS: get-campaigns-campaign-finance-otherCosts */

import CampaignRoute from "@src/features/routes/CampaignRoute";
import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";

type OtherCost = {
  cost_id: number;
  type: {
    name: string;
    id: number;
  };
  supplier: {
    name: string;
    id: number;
  };
  description: string;
  attachments: {
    id: number;
    url: string;
    mimetype: string;
  }[];
};

export default class OtherCostsRoute extends CampaignRoute<{
  response: StoplightOperations["get-campaigns-campaign-finance-otherCosts"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-campaigns-campaign-finance-otherCosts"]["parameters"]["path"];
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
    const costs = await this.getOtherCosts();

    return this.setSuccess(200, { items: costs });
  }

  private async getOtherCosts(): Promise<OtherCost[]> {
    const costs = await tryber.tables.WpAppqCampaignOtherCosts.do()
      .select(
        tryber
          .ref("id")
          .withSchema("wp_appq_campaign_other_costs")
          .as("cost_id"),
        "description",
        "type_id",
        "supplier_id"
      )
      .where("campaign_id", this.cp_id);

    if (!costs.length) return [];

    const typeIds = [...new Set(costs.map((c) => c.type_id))];
    const supplierIds = [...new Set(costs.map((c) => c.supplier_id))];
    const costIds = costs.map((c) => c.cost_id);

    const types = await tryber.tables.WpAppqCampaignOtherCostsType.do()
      .select("id", "name")
      .whereIn("id", typeIds);

    const suppliers = await tryber.tables.WpAppqCampaignOtherCostsSupplier.do()
      .select("id", "name")
      .whereIn("id", supplierIds);

    const attachments =
      await tryber.tables.WpAppqCampaignOtherCostsAttachment.do()
        .select("id", "url", "mime_type", "cost_id")
        .whereIn("cost_id", costIds);

    return costs.map((cost) => {
      const type = types.find((t) => t.id === cost.type_id);
      const supplier = suppliers.find((s) => s.id === cost.supplier_id);
      const costAttachments = attachments.filter(
        (a) => a.cost_id === cost.cost_id
      );

      return {
        cost_id: cost.cost_id,
        type: {
          name: type?.name || "",
          id: type?.id || 0,
        },
        supplier: {
          name: supplier?.name || "",
          id: supplier?.id || 0,
        },
        description: cost.description,
        attachments: costAttachments.map((a) => ({
          id: a.id,
          url: a.url,
          mimetype: a.mime_type,
        })),
      };
    });
  }
}
