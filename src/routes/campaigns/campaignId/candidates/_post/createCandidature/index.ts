import * as db from "@src/features/db";

export default async (wpId: number, campaignId: number) => {
  let candidatureCreation = await db.query(
    db.format(
      `INSERT INTO wp_crowd_appq_has_candidate 
            (user_id, campaign_id, accepted, results, devices, selected_device, group_id)
          VALUES 
            (?, ?, 1 , 0 , 0 , 0 , 1)`,
      [wpId, campaignId]
    )
  );
  let candidature = await db.query(
    //get candidature
    db.format(
      `
        SELECT t.id as tester_id, 
            cand.campaign_id as campaign_id, cand.results as status, cand.selected_device as device, cand.accepted as accepted 
          FROM wp_crowd_appq_has_candidate cand 
          JOIN wp_appq_evd_profile t ON (t.wp_user_id = cand.user_id) 
        WHERE cand.user_id = ? AND campaign_id = ?`,
      [wpId, campaignId]
    )
  );
  if (!candidature.length) {
    throw new Error("Error adding candidature");
  }
  return candidature[0];
};
