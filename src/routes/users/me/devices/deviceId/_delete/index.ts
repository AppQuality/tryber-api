/** OPENAPI-ROUTE: delete-users-me-devices-deviceId */
import { Context } from "openapi-backend";

import * as db from "../../../../../../features/db";

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  const deviceId =
    typeof c.request.params.deviceId === "string"
      ? c.request.params.deviceId
      : "0";
  try {
    let sql = `
	SELECT dv.id
		FROM wp_crowd_appq_device  dv
		JOIN wp_appq_evd_profile p ON (p.id = dv.id_profile)
	`;
    let where = ` p.wp_user_id = ? AND dv.id = ? AND enabled = 1`;
    let queryData = [req.user.ID, deviceId];

    sql = `${sql} WHERE ${where}`;

    const devices = await db.query(db.format(sql, queryData));
    if (!devices.length) throw Error("No device on your user");
    const device = devices[0];

    let checkCandidateSql = `
    SELECT cp.id
      FROM wp_appq_evd_campaign cp
               JOIN wp_crowd_appq_has_candidate ca ON cp.id = ca.campaign_id
    `;
    let checkCandidateWhere = ` cp.campaign_type_id != 3
      AND status_id != 2 
      AND ca.selected_device = ?`;
    let checkCandidateQueryData = [deviceId];
    checkCandidateSql = `${checkCandidateSql} WHERE ${checkCandidateWhere}`;

    const candidated = await db.query(
      db.format(checkCandidateSql, checkCandidateQueryData)
    );

    if (candidated.length)
      throw {
        status_code: 406,
        message:
          "You are candidated to a campaign with this device (" +
          candidated.map((c: { id: string }) => c.id).join(",") +
          ")",
      };
    const update = `
    UPDATE wp_crowd_appq_device 
    SET enabled = 0
    WHERE id = ?
`;
    const updateData = [deviceId];
    await db.query(db.format(update, updateData));
    res.status_code = 200;
    return { message: "Successfully deleted" };
  } catch (error) {
    res.status_code = (error as OpenapiError).status_code || 400;
    return {
      element: "devices",
      id: parseInt(deviceId),
      message: (error as OpenapiError).message,
    };
  }
};
