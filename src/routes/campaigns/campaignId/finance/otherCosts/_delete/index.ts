/** OPENAPI-CLASS: delete-campaigns-campaign-finance-otherCosts */

import CampaignRoute from "@src/features/routes/CampaignRoute";
import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";
import deleteFromS3 from "@src/features/deleteFromS3";

export default class OtherCostsDeleteRoute extends CampaignRoute<{
  response: StoplightOperations["delete-campaigns-campaign-finance-otherCosts"]["responses"]["200"];
  parameters: StoplightOperations["delete-campaigns-campaign-finance-otherCosts"]["parameters"]["path"];
  body: StoplightOperations["delete-campaigns-campaign-finance-otherCosts"]["requestBody"]["content"]["application/json"];
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

    return true;
  }

  protected async prepare(): Promise<void> {
    try {
      const body = this.getBody();
      await this.deleteOtherCost(body.cost_id);

      return this.setSuccess(200, {});
    } catch (e) {
      console.error("Error deleting other cost: ", e);
      return this.setError(500, new OpenapiError("Error deleting other cost"));
    }
  }

  private async costExistsInCampaign(costId: number): Promise<boolean> {
    const cost = await tryber.tables.WpAppqCampaignOtherCosts.do()
      .where({ id: costId, campaign_id: this.cp_id })
      .first();
    return cost !== undefined;
  }

  private async deleteOtherCost(costId: number): Promise<void> {
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
        await tryber.tables.WpAppqCampaignOtherCostsAttachment.do()
          .where({ id: attachment.id })
          .delete();
      }
    }

    await tryber.tables.WpAppqCampaignOtherCosts.do()
      .where({ id: costId })
      .delete();
  }
}
