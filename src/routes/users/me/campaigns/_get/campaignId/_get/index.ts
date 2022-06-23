import * as db from "@src/features/db";
import { Context } from "openapi-backend";

/** OPENAPI-ROUTE: get-users-me-campaigns-campaignId */
export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
): Promise<Result | ReturnErrorType> => {
  const params = c.request.params as PathParameters;
  const campaignId = parseInt(params.campaignId);
  try {
    await isCandidate();
  } catch {
    res.status_code = 404;
    return {
      id: campaignId,
      element: "campaigns",
      message: "You don't have access to a campaign with this id",
    };
  }

  res.status_code = 200;
  return {
    id: campaignId,
    title: "",
    minimumMedia: 0,
    useCases: [],
    bugTypes: { valid: [], invalid: [] },
    bugReplicability: { valid: [], invalid: [] },
    bugSeverity: { valid: [], invalid: [] },
    hasBugForm: true,
    validFileExtensions: [],
  };

  async function isCandidate() {
    const candidature = await db.query(
      db.format(
        "SELECT * FROM wp_crowd_appq_has_candidate WHERE user_id = ? AND campaign_id = ?",
        [req.user.ID, campaignId]
      )
    );
    if (candidature.length === 0)
      throw Error("You are not selected for this campaign");
  }
};
