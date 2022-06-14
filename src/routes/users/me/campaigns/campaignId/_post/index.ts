import * as db from "@src/features/db";
import { Context } from "openapi-backend";

/** OPENAPI-ROUTE: post-users-me-campaigns-campaign-bugs */
export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  try {
    console.log("inside");
    const campaignId = c.request.params.campaignId;

    let existsCampaignQuery = `SELECT id FROM wp_appq_evd_campaign WHERE id=? ;`;
    let existsCampaign = await db.query(
      db.format(existsCampaignQuery, [campaignId.toString()])
    );
    if (!existsCampaign.length) {
      console.log("ciao");
      throw {
        status_code: 404,
        message: `CampaignId ${campaignId}, does not exists.`,
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
  } catch (error) {
    console.log("ERR");
    if (process.env && process.env.DEBUG) console.log(error);
    res.status_code = (error as OpenapiError).status_code || 400;
    return {
      element: "post a bug",
      id: 0,
      message: (error as OpenapiError).message,
    };
  }
};
