/** OPENAPI-ROUTE: get-users-me-devices-deviceId */
import { Context } from 'openapi-backend';

import * as db from '../../../../../../features/db';

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
		SELECT dv.id, dv.form_factor as deviceType, dv.manufacturer, dv.model, dv.pc_type, os.display_name as osVersion, plat.name as os,dv.os_version_id  as os_id
FROM wp_crowd_appq_device dv
         JOIN wp_appq_evd_platform plat ON (dv.platform_id = plat.id)
         JOIN wp_appq_os os ON (dv.os_version_id = os.id)
         JOIN wp_appq_evd_profile p ON (p.id = dv.id_profile)
		`;
    let where = ` p.wp_user_id = ? AND dv.id = ? AND enabled = 1`;
    let queryData = [req.user.ID, deviceId];

    sql = `${sql} WHERE ${where}`;
    sql = db.format(sql, queryData);

    const devices = await db.query(sql);
    if (!devices.length) throw Error("This device doesn't exists");
    const d = devices[0];

    res.status_code = 200;
    return {
      type: d.deviceType,
      id: d.id,
      device: {
        manufacturer: (d.manufacturer !== "-" && d.manufacturer) || undefined,
        model: (d.model !== "-" && d.model) || undefined,
        pc_type: d.pc_type
          ? d.pc_type.charAt(0).toUpperCase() + d.pc_type.slice(1)
          : undefined,
      },
      operating_system: {
        id: d.os_id,
        platform: d.os,
        version: d.osVersion,
      },
    };
  } catch (error) {
    res.status_code = 404;
    return {
      element: "devices",
      id: parseInt(deviceId),
      message: (error as OpenapiError).message,
    };
  }
};
