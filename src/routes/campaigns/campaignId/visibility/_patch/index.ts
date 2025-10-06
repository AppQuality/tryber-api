/** OPENAPI-CLASS: patch-campaigns-campaignId-visibility */

import Campaign from "@src/features/class/Campaign";
import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";
import UserRoute from "@src/features/routes/UserRoute";

export default class PatchCampaignVisibility extends UserRoute<{
  response: StoplightOperations["patch-campaigns-campaignId-visibility"]["responses"]["200"];
  body: StoplightOperations["patch-campaigns-campaignId-visibility"]["requestBody"]["content"]["application/json"];
  parameters: StoplightOperations["patch-campaigns-campaignId-visibility"]["parameters"]["path"];
}> {
  private campaign: Campaign | undefined;
  private campaignId: number | undefined;

  protected async init(): Promise<void> {
    await super.init();
    this.campaignId = Number(this.getParameters().campaignId);
    this.campaign = new Campaign(this.campaignId, false);
  }

  protected async filter() {
    if (!(await super.filter())) return false;

    if (!(await this.campaignExists())) {
      this.setError(404, new OpenapiError("Campaign not found"));
      return false;
    }

    if (await this.doesNotHaveAccessToCampaign()) {
      this.setError(
        403,
        new OpenapiError("You don't have access to this campaign")
      );
      return false;
    }
    return true;
  }

  protected async prepare() {
    if (!this.campaign)
      return this.setError(403, new OpenapiError("Campaign not valid"));

    const { type } = this.getBody();

    try {
      await this.campaign.changeVisibility(type);
      this.setSuccess(200, {});
    } catch {
      this.setError(
        500,
        new OpenapiError("Error updating campaign visibility")
      );
    }
  }

  private async campaignExists(): Promise<boolean> {
    const cp = await tryber.tables.WpAppqEvdCampaign.do()
      .where({ id: Number(this.campaignId) })
      .first();
    return !!cp;
  }

  private async doesNotHaveAccessToCampaign() {
    return !this.hasAccessToCampaign(Number(this.campaignId));
  }
}
