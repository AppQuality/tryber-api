/** OPENAPI-ROUTE: get-users-me-campaigns-campaignId */

import { Context } from "openapi-backend";
import Campaign from "@src/features/class/Campaign";
import { Result } from "./types.d";

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
): Promise<Result | ReturnErrorType> => {
  const params = c.request.params as PathParameters;
  const campaignId = parseInt(params.campaignId);
  const campaign = new Campaign(campaignId, false);
  try {
    if (!(await campaign.isUserCandidate(req.user.ID, isAdmin())))
      throw new Error("You are not selected for this campaign");
  } catch {
    res.status_code = 404;
    return {
      id: campaignId,
      element: "campaigns",
      message: "You don't have access to a campaign with this id",
    };
  }
  try {
    campaign.init();
    await campaign.ready;
    res.status_code = 200;
    return {
      id: campaign.id,
      title: campaign.title,
      minimumMedia: campaign.min_allowed_media,
      hasBugForm: campaign.hasBugForm,
      bugSeverity: await campaign.getAvailableSeverities(),
      bugReplicability: await campaign.getAvailableReplicabilities(),
      useCases: await campaign.getUserUseCases(req.user.ID),
      bugTypes: await campaign.getAvailableTypes(),
      validFileExtensions: await campaign.getAvailableFileExtensions(),
      additionalFields: await campaign.getAdditionalFields(),
      language: await campaign.getBugLanguageMessage(),
      titleRule: await campaign.getTitleRule(),
    };
  } catch (err) {
    res.status_code = 500;
    return {
      id: campaignId,
      element: "campaigns",
      message: (err as OpenapiError).message,
    };
  }

  function isAdmin(): any {
    if (!req.user.permission.admin) return false;
    if (!req.user.permission.admin.appq_campaign) return false;
    if (req.user.permission.admin.appq_campaign === true) return true;
    if (req.user.permission.admin.appq_campaign.includes(campaignId))
      return true;
    return false;
  }
};
