import * as db from "@src/features/db";

export default async (testerId: number, campaignId: number) => {
  const tester = await db.query(
    db.format(
      `
      SELECT cand.user_id AS id
      FROM wp_crowd_appq_has_candidate cand
         JOIN wp_appq_evd_profile profile ON cand.user_id = profile.wp_user_id
      WHERE profile.id = ?
      AND cand.campaign_id = ? AND accepted = 1
      `,
      [testerId, campaignId]
    )
  );
  if (tester.length) {
    throw new Error("This tester is already candidate for this campaign");
  }
};
