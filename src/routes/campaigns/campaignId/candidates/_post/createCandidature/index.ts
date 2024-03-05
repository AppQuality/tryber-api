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
            SET accepted = 1, selected_device = ?, accepted_date = '${getFormattedDate()}'
            WHERE user_id = ? AND campaign_id = ?`,
        [selectedDevice, wpId, campaignId]
      )
    );
  } else {
    await db.query(
      db.format(
        `INSERT INTO wp_crowd_appq_has_candidate 
              (user_id, campaign_id, accepted, results, devices, selected_device, group_id , accepted_date)
            VALUES 
              (?, ?, 1 , 0 , 0 , ? , 1, '${getFormattedDate()}')`,
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

const getFormattedDate = () => {
  const currentDate = new Date();
  return (
    currentDate.getFullYear() +
    "-" +
    padZero(currentDate.getMonth() + 1) +
    "-" +
    padZero(currentDate.getDate()) +
    " " +
    padZero(currentDate.getHours()) +
    ":" +
    padZero(currentDate.getMinutes()) +
    ":" +
    padZero(currentDate.getSeconds())
  );
};
function padZero(number: number) {
  return (number < 10 ? "0" : "") + number;
}
