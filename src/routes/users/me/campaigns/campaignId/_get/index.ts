/** OPENAPI-CLASS: get-users-me-campaigns-campaignId */

import Campaign from "@src/features/class/Campaign";
import UserRoute from "@src/features/routes/UserRoute";

export default class UserSingleCampaignRoute extends UserRoute<{
  response: StoplightOperations["get-users-me-campaigns-campaignId"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-users-me-campaigns-campaignId"]["parameters"]["path"];
}> {
  private campaign: Campaign;

  constructor(protected configuration: RouteClassConfiguration) {
    super({ ...configuration, element: "campaigns" });
    const params = this.getParameters();
    const campaignId = parseInt(params.campaignId);
    this.campaign = new Campaign(campaignId, false);
  }

  protected async init(): Promise<void> {
    this.campaign.init();
    await this.campaign.ready;
  }

  protected async filter(): Promise<boolean> {
    if (
      !(await this.campaign.isUserCandidate(
        this.getWordpressId().toString(),
        this.isAdmin()
      ))
    ) {
      this.setError(
        404,
        "You are not selected for this campaign" as unknown as OpenapiError
      );
      return false;
    }
    return true;
  }

  protected async prepare() {
    try {
      this.setSuccess(200, {
        id: this.campaign.id,
        title: this.campaign.title,
        minimumMedia: this.campaign.min_allowed_media,
        hasBugForm: this.campaign.hasBugForm,
        bugSeverity: await this.campaign.getAvailableSeverities(),
        bugReplicability: await this.campaign.getAvailableReplicabilities(),
        useCases: await this.campaign.getUserUseCases(
          this.getWordpressId().toString()
        ),
        bugTypes: await this.campaign.getAvailableTypes(),
        validFileExtensions: await this.campaign.getAvailableFileExtensions(),
        additionalFields: await this.campaign.getAdditionalFields(),
        language: await this.campaign.getBugLanguageMessage(),
        titleRule: await this.campaign.getTitleRule(),
      });
    } catch (error) {
      this.setError(500, error as OpenapiError);
    }
  }

  private isAdmin() {
    if (!this.configuration.request.user.permission.admin) return false;
    if (!this.configuration.request.user.permission.admin.appq_campaign)
      return false;
    if (this.configuration.request.user.permission.admin.appq_campaign === true)
      return true;
    if (
      this.configuration.request.user.permission.admin.appq_campaign.includes(
        this.campaign.id
      )
    )
      return true;
    return false;
  }
}
