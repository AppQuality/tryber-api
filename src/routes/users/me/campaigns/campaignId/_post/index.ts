import * as db from "@src/features/db";
import { Context } from "openapi-backend";

/** OPENAPI-ROUTE: post-users-me-campaigns-campaign-bugs */
export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  const params = c.request
    .params as StoplightOperations["post-users-me-campaigns-campaign-bugs"]["parameters"]["path"];
  const campaignId = parseInt(params.campaignId);
  try {
    await campaignExists();
    await testerIsCandidate();
  } catch (error) {
    if (process.env && process.env.DEBUG) console.log(error);
    res.status_code = (error as OpenapiError).status_code || 400;
    return {
      element: "bugs",
      id: 0,
      message: (error as OpenapiError).message,
    };
  }

  return {};

  async function campaignExists() {
    const result = await db.query(
      db.format(`SELECT id FROM wp_appq_evd_campaign WHERE id=? ;`, [
        campaignId,
      ])
    );
    if (!result.length) {
      throw {
        status_code: 404,
        message: `CP${campaignId}, does not exists.`,
      };
    }
  }

  async function testerIsCandidate() {
    const result = await db.query(
      db.format(
        `SELECT campaign_id FROM wp_crowd_appq_has_candidate WHERE user_id=? AND campaign_id=? ;`,
        [req.user.ID, campaignId]
      )
    );
    if (!result.length) {
      throw {
        status_code: 403,
        message: `T${req.user.testerId} is not candidate on CP${campaignId}.`,
      };
    }
  }
};
