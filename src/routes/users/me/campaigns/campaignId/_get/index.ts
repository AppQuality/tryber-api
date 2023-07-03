/** OPENAPI-CLASS: get-users-me-campaigns-campaignId */

import OpenapiError from "@src/features/OpenapiError";
import Campaign from "@src/features/class/Campaign";
import UserRoute from "@src/features/routes/UserRoute";

export default class UserSingleCampaignRoute extends UserRoute<{
  response: StoplightOperations["get-users-me-campaigns-campaignId"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-users-me-campaigns-campaignId"]["parameters"]["path"];
}> {
  private campaignId = parseInt(this.getParameters().campaignId);

  protected async filter(): Promise<boolean> {
    if (await this.testerIsNotCandidate()) return false;

    return true;
  }

  protected async prepare() {
    const campaign = new Campaign(this.campaignId, false);
    campaign.init();
    await campaign.ready;
    if (!campaign) throw new Error("Campaign not found");

    try {
      this.setSuccess(200, {
        id: campaign.id,
        title: campaign.title,
        minimumMedia: campaign.min_allowed_media,
        hasBugForm: campaign.hasBugForm,
        bugSeverity: await campaign.getAvailableSeverities(),
        bugReplicability: await campaign.getAvailableReplicabilities(),
        useCases: await campaign.getUserUseCases(
          this.getWordpressId().toString()
        ),
        bugTypes: await campaign.getAvailableTypes(),
        validFileExtensions: await campaign.getAvailableFileExtensions(),
        additionalFields: await campaign.getAdditionalFields(),
        language: await campaign.getBugLanguageMessage(),
        titleRule: await campaign.getTitleRule(),
      });
    } catch (error) {
      this.setError(500, error as OpenapiError);
    }
  }

  private async testerIsNotCandidate() {
    const campaign = new Campaign(this.campaignId, false);

    if (
      !(await campaign.isUserCandidate(
        this.getWordpressId().toString(),
        this.isAdmin()
      ))
    ) {
      this.setError(
        404,
        new OpenapiError("You are not selected for this campaign")
      );
      return true;
    }
    return false;
  }

  private isAdmin() {
    if (!this.configuration.request.user.permission.admin) return false;
    if (!this.configuration.request.user.permission.admin.appq_campaign)
      return false;
    if (this.configuration.request.user.permission.admin.appq_campaign === true)
      return true;
    if (
      this.configuration.request.user.permission.admin.appq_campaign.includes(
        this.campaignId
      )
    )
      return true;
    return false;
  }
}
