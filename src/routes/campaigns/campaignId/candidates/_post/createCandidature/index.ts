import * as db from "@src/features/db";

export default async (testerId: number, campaignId: number) => {
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
    throw new Error("Error adding candidature");
  }
  return candidature[0];
};
