import * as db from "@src/features/db";
import { Context } from "openapi-backend";

/** OPENAPI-ROUTE: post-users-me-campaigns-campaign-bugs */
export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  try {
    const campaignId = c.request.params.campaignId;

    let existsCampaignQuery = `SELECT id FROM wp_appq_evd_campaign WHERE id=? ;`;
    let existsCampaign = await db.query(
      db.format(existsCampaignQuery, [campaignId.toString()])
    );
    if (!existsCampaign.length) {
      throw {
        status_code: 404,
        message: `CampaignId ${campaignId}, does not exists.`,
      };
    }

    let isCandidateQuery = `SELECT * FROM wp_crowd_appq_has_candidate WHERE user_id=? AND campaign_id=? ;`;
    let isCandidate = await db.query(
      db.format(isCandidateQuery, [req.user.ID, campaignId.toString()])
    );
    if (!isCandidate.length) {
      throw {
        status_code: 403,
        message: `T${req.user.testerId} is not candidate on CP${campaignId}.`,
      };
    }

    // let deleteSql = `DELETE FROM wp_appq_profile_certifications WHERE cert_id=? AND tester_id=?;`;
    // let deleted;
    // try {
    //   deleted = await db.query(
    //     db.format(deleteSql, [certificationId, req.user.testerId])
    //   );
    //   res.status_code = 200;
    //   return { message: "Certification successfully removed" };
    // } catch (e) {
    //   if (process.env && process.env.DEBUG) console.log(e);
    //   throw Error("Failed to remove user Certification");
    // }
    return {};
  } catch (error) {
    if (process.env && process.env.DEBUG) console.log(error);
    res.status_code = (error as OpenapiError).status_code || 400;
    return {
      element: "post a bug",
      id: 0,
      message: (error as OpenapiError).message,
    };
  }
};
