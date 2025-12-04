/** OPENAPI-CLASS: put-dossiers-campaign-agreements */

import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";
import CampaignRoute from "@src/features/routes/CampaignRoute";

export default class RouteItem extends CampaignRoute<{
  response: StoplightOperations["put-dossiers-campaign-agreements"]["responses"]["200"];
  parameters: StoplightOperations["put-dossiers-campaign-agreements"]["parameters"]["path"];
  body: StoplightOperations["put-dossiers-campaign-agreements"]["requestBody"]["content"]["application/json"];
}> {
  protected async filter() {
    if (!(await super.filter())) return false;

    if (!this.hasAccessToCampaign(this.cp_id)) {
      this.setError(403, new OpenapiError("You are not authorized to do this"));
      return false;
    }

    if (await this.isInvalidBody()) {
      this.setError(400, new OpenapiError("Invalid request body"));
      return false;
    }

    return true;
  }

  private isInvalidBody(): boolean {
    const { agreementId, tokens } = this.getBody();
    if (
      typeof agreementId !== "number" ||
      agreementId <= 0 ||
      !Number.isInteger(agreementId) ||
      typeof tokens !== "number" ||
      tokens <= 0
    ) {
      return true;
    }
    return false;
  }

  private async updateCampaignUsedTokens() {
    const { tokens } = this.getBody();
    try {
      await tryber.tables.WpAppqEvdCampaign.do()
        .update({ tokens_usage: tokens })
        .where("id", this.cp_id);
    } catch (error) {
      throw new OpenapiError("Failed to update campaign tokens usage");
    }
  }
  private async updateAgreementAndCampaignLink() {
    const { agreementId } = this.getBody();
    try {
      const link = await tryber.tables.FinanceCampaignToAgreement.do()
        .select("agreement_id")
        .where("cp_id", this.cp_id)
        .first();

      if (link) {
        await tryber.tables.FinanceCampaignToAgreement.do()
          .update({
            agreement_id: agreementId,
            last_editor_id: this.getTesterId(),
          })
          .where("cp_id", this.cp_id);
      } else {
        await tryber.tables.FinanceCampaignToAgreement.do().insert({
          cp_id: this.cp_id,
          agreement_id: agreementId,
          last_editor_id: this.getTesterId(),
        });
      }
    } catch (error) {
      throw new OpenapiError("Failed to update campaign and agreement link");
    }
  }

  protected async prepare() {
    try {
      await this.updateCampaignUsedTokens();
    } catch (error: OpenapiError | any) {
      this.setError(500, { message: error.message } as OpenapiError);
      return;
    }
    try {
      await this.updateAgreementAndCampaignLink();
    } catch (error: OpenapiError | any) {
      this.setError(500, {
        message: error.message,
      } as OpenapiError);
      return;
    }

    this.setSuccess(200, {});
  }
}
