import { Context } from "openapi-backend";
import { Result } from "./types";
import Campaign from "@src/features/class/Campaign";

/** OPENAPI-ROUTE : get-users-me-campaigns-campaignId-devices */
export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
): Promise<Result | ReturnErrorType> => {
  const params = c.request.params as PathParameters;
  const campaignId = parseInt(params.campaignId);
  const campaign = new Campaign(campaignId, false);
  try {
    if (!(await campaign.isUserCandidate(req.user.ID)))
      throw new Error("You are not selected for this campaign");
  } catch {
    res.status_code = 404;
    return {
      id: campaignId,
      element: "campaigns",
      message: "You don't have access to a campaign with this id",
    };
  }

  const devices = await campaign.getAvailableDevices({
    userId: req.user.ID,
    testerId: req.user.testerId,
  });
  if (devices.length === 0) {
    res.status_code = 404;
    return {
      id: campaignId,
      element: "campaigns",
      message: "There are no devices available for this campaign",
    };
  }
  res.status_code = 200;
  return devices;
};
