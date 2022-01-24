/** OPENAPI-ROUTE: get-users-me-devices */
import { Context } from 'openapi-backend';

import * as db from '../../../../../features/db';

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  try {
    let sql = `
    SELECT dv.id,
       dv.form_factor   as deviceType,
       dv.manufacturer,
       dv.model,
       dv.pc_type,
       concat(os.display_name, " (",os.version_number,")")  as osVersion,
       plat.name        as os,
       dv.os_version_id as os_id,
       source_id     as deviceId
FROM wp_crowd_appq_device dv
         JOIN wp_appq_evd_platform plat ON (dv.platform_id = plat.id)
         JOIN wp_appq_os os ON (dv.os_version_id = os.id)
         JOIN wp_appq_evd_profile p ON (p.id = dv.id_profile)
    `;
    let where = ` p.wp_user_id = ? AND enabled = 1 
      AND dv.form_factor IN ('Smartphone','PC','Tablet','Smart-tv')`;
    let queryData = [req.user.ID];

    sql = `${sql} WHERE ${where} 
      ORDER BY case when dv.form_factor = 'Smartphone' then 1
                    when dv.form_factor = 'PC' then 2
                    when dv.form_factor = 'Tablet' then 3
                    when dv.form_factor = 'Smart-tv' then 4
                    else 5
               end asc , plat.name ASC`;
    sql = db.format(sql, queryData);
    const results: {
      deviceId?: string;
      pc_type?: string;
      deviceType: string;
      id: string;
      manufacturer: string;
      model: string;
      os_id: string;
      os: string;
      osVersion: string;
    }[] = await db.query(sql);
    const devices = results.filter((d) => d.deviceId || d.pc_type);
    if (!devices.length) throw Error("No device on your user");

    res.status_code = 200;
    return devices.map((d) => {
      return {
        type: d.deviceType,
        id: d.id,
        device: {
          manufacturer: (d.manufacturer !== "-" && d.manufacturer) || undefined,
          model: (d.model !== "-" && d.model) || undefined,
          id: d.deviceId || undefined,
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
    });
  } catch (error) {
    res.status_code = 404;
    return {
      element: "devices",
      id: parseInt(req.user.ID),
      message: (error as OpenapiError).message,
    };
  }
};
