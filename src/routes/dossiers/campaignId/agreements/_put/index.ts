/** OPENAPI-CLASS: put-dossiers-campaign-agreements */

import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";
import UserRoute from "@src/features/routes/UserRoute";

export default class RouteItem extends UserRoute<{
  response: StoplightOperations["put-dossiers-campaign-agreements"]["responses"]["200"];
  parameters: StoplightOperations["put-dossiers-campaign-agreements"]["parameters"]["path"];
  body: StoplightOperations["put-dossiers-campaign-agreements"]["requestBody"]["content"]["application/json"];
}> {
  private campaignId: number;
  private accessibleCampaigns: true | number[] = this.campaignOlps
    ? this.campaignOlps
    : [];

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    this.campaignId = Number(this.getParameters().campaign);
  }

  protected async filter() {
    if (!(await super.filter())) return false;

    if (
      (await this.doesNotHaveAccess()) ||
      (await this.campaignDoesNotExists())
    ) {
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

  private async doesNotHaveAccess() {
    if (this.accessibleCampaigns === true) return false;
    if (Array.isArray(this.accessibleCampaigns))
      return !this.accessibleCampaigns.includes(this.campaignId);
    return true;
  }

  private async campaignDoesNotExists() {
    try {
      const campaign = await tryber.tables.WpAppqEvdCampaign.do()
        .select("id")
        .where("id", this.campaignId)
        .first();
      if (!campaign) return true;
      return false;
    } catch (error) {
      return true;
    }
  }

  private async updateCampaignUsedTokens() {
    const { tokens } = this.getBody();
    try {
      await tryber.tables.WpAppqEvdCampaign.do()
        .update({ tokens_usage: tokens })
        .where("id", this.campaignId);
    } catch (error) {
      throw new OpenapiError("Failed to update campaign tokens usage");
    }
  }
  private async updateAgreementAndCampaignLink() {
    const { agreementId } = this.getBody();
    try {
      const link = await tryber.tables.FinanceCampaignToAgreement.do()
        .select("agreement_id")
        .where("cp_id", this.campaignId)
        .first();

      if (link) {
        await tryber.tables.FinanceCampaignToAgreement.do()
          .update({
            agreement_id: agreementId,
            last_editor_id: this.getTesterId(),
          })
          .where("cp_id", this.campaignId);
      } else {
        await tryber.tables.FinanceCampaignToAgreement.do().insert({
          cp_id: this.campaignId,
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
