import * as db from "@src/features/db";
import debugMessage from "@src/features/debugMessage";
import { Context } from "openapi-backend";

/** OPENAPI-ROUTE: post-campaigns-campaign-candidates */
export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  if (req.user.role !== "administrator") {
    res.status_code = 403;
    return {};
  }
  let campaignId, testerId;
  try {
    //check campaignId
    campaignId = c.request.params.campaign;
    if (typeof campaignId !== "string") {
      throw Error("Invalid payment query parameter");
    }

    let resCpExist = await db.query(
      db.format(`SELECT id FROM wp_appq_evd_campaign WHERE id = ? `, [
        campaignId,
      ])
    );
    const cpIdExist = resCpExist[0]?.id ?? 0;
    if (!cpIdExist) {
      res.status_code = 404;
      return {
        id: 0,
        element: "campaign-id",
        message: "wrong campaign id, campaign id does not exist",
      };
    }

    //check testerId
    testerId = req.body.tester_id;
    let resTesterExist = await db.query(
      db.format(`SELECT id FROM wp_appq_evd_profile WHERE id = ? `, [testerId])
    );
    const testerExist = resTesterExist[0]?.id ?? 0;
    if (!testerExist) {
      res.status_code = 404;
      return {
        id: 0,
        element: "tester-id",
        message: "wrong tester-id. tester-id does not exist",
      };
    }
    /*
    //check tester is already candidate on campaign
    let resTesterJustCandidate = await db.query(
      db.format(
        `
      SELECT cand.user_id AS id
      FROM wp_crowd_appq_has_candidate cand
         JOIN wp_users users ON cand.user_id = users.ID
         JOIN wp_appq_evd_profile profile ON users.ID = profile.wp_user_id
      WHERE profile.id = ?
      AND cand.campaign_id = ?;
      `,
        [testerId, parseInt(campaignId)]
      )
    );
    const testerJustCandidate = resTesterJustCandidate[0]?.id ?? 0;
    console.log(testerJustCandidate)
    if (testerJustCandidate) {
      res.status_code = 403;
      return {
        message: "this tester is already candidate for this campaign",
      };
    }

*/

    res.status_code = 200;
    return {
      tester_id: 1,
      accepted: true,
      status: "ready",
      device: "any",
    };
  } catch (err) {
    debugMessage(err);
    res.status_code = 404;
    return {
      id: 0,
      message: "?? not found",
      element: "candidate-tryber-on-campaign",
    };
  }
};
