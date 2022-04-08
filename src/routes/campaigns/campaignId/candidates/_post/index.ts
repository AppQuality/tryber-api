import * as db from "@src/features/db";
import debugMessage from "@src/features/debugMessage";
import { Context } from "openapi-backend";

const adminOnly = (role: string) => {
  if (role !== "administrator") {
    throw new Error("You are not an administrator");
  }
};
const campaignShouldExist = async (campaignId: number) => {
  const campaign = await db.query(
    db.format(`SELECT id FROM wp_appq_evd_campaign WHERE id = ? `, [campaignId])
  );
  if (!campaign.length) {
    throw new Error("Campaign does not exist");
  }
};
const testerShouldExist = async (testerId: number) => {
  const tester = await db.query(
    db.format(`SELECT id FROM wp_appq_evd_profile WHERE id = ? `, [testerId])
  );
  if (!tester.length) {
    throw new Error("Tester does not exist");
  }
};
const testerShouldNotBeCandidate = async (
  testerId: number,
  campaignId: number
) => {
  const tester = await db.query(
    db.format(
      `
    SELECT cand.user_id AS id
    FROM wp_crowd_appq_has_candidate cand
       JOIN wp_appq_evd_profile profile ON cand.user_id = profile.wp_user_id
    WHERE profile.id = ?
    AND cand.campaign_id = ?;
    `,
      [testerId, campaignId]
    )
  );
  if (!tester.length) {
    throw new Error("This tester is already candidate for this campaign");
  }
};
/** OPENAPI-ROUTE: post-campaigns-campaign-candidates */
export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  const body =
    req.body as StoplightOperations["post-campaigns-campaign-candidates"]["requestBody"]["content"]["application/json"];
  const campaignId = parseInt(
    typeof c.request.params.campaign === "string"
      ? c.request.params.campaign
      : "-1"
  );
  const testerId = body.tester_id;
  try {
    adminOnly(req.user.role);
    await campaignShouldExist(campaignId);
    await testerShouldExist(testerId);
    await testerShouldNotBeCandidate(testerId, campaignId);
  } catch (err) {
    res.status_code = 403;
    return {
      error: (err as OpenapiError).message,
    };
  }
  try {
    let resCandidate = await db.query(
      db.format(
        `INSERT INTO wp_crowd_appq_has_candidate 
          (user_id, campaign_id, accepted, results, devices, selected_device, group_id)
        VALUES 
          (?, ?, 1 , 0 , 0 , 0 , 1)`,
        [testerId, campaignId]
      )
    );
    let candidatureId = resCandidate?.insertId ?? 0;
    let candidature = await db.query(
      //get candidature
      db.format(
        `
      SELECT t.id as tester_id, cand.campaign_id as campaign_id, cand.results as status, cand.devices as device, cand.accepted as accepted 
        FROM wp_crowd_appq_has_candidate cand 
        JOIN wp_appq_evd_profile t ON (t.wp_user_id = cand.user_id) 
      WHERE id = ?`,
        [candidatureId]
      )
    );
    if (!candidature.length) {
      res.status_code = 500;
      return {
        message: "Error adding candidature",
      };
    }
    candidature = candidature[0];

    res.status_code = 200;
    return {
      tester_id: candidature.tester_id,
      accepted: candidature.accepted == 1,
      campaign_id: candidature.campaign_id,
      status:
        candidature.status === 0
          ? "ready"
          : candidature.status === -1
          ? "removed"
          : candidature.status === 1
          ? "excluded"
          : candidature.status === 2
          ? "in-progress"
          : candidature.status === 3
          ? "completed"
          : "unknown",
      device: candidature.device == 0 ? "any" : "invalid",
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
