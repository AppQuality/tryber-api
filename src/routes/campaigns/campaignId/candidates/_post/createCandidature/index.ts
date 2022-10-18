import * as db from "@src/features/db";

export default async (
  wpId: number,
  campaignId: number,
  selectedDevice: number
) => {
  const isCandidate = await db.query(
    db.format(
      `
      SELECT user_id
      FROM wp_crowd_appq_has_candidate
      WHERE user_id = ? AND campaign_id = ? 
      `,
      [wpId, campaignId]
    )
  );
  if (isCandidate.length) {
    await db.query(
      db.format(
        `UPDATE wp_crowd_appq_has_candidate 
            SET accepted = 1, selected_device = ?
            WHERE user_id = ? AND campaign_id = ?`,
        [selectedDevice, wpId, campaignId]
      )
    );
  } else {
    await db.query(
      db.format(
        `INSERT INTO wp_crowd_appq_has_candidate 
              (user_id, campaign_id, accepted, results, devices, selected_device, group_id)
            VALUES 
              (?, ?, 1 , 0 , 0 , ? , 1)`,
        [wpId, campaignId, selectedDevice]
      )
    );
  }
  return {
    wordpress_id: wpId,
    campaign_id: campaignId,
    device: selectedDevice,
  };
};
