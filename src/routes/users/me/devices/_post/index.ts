/** OPENAPI-ROUTE: post-users-me-devices */
import { Context } from 'openapi-backend';

import * as db from '../../../../../features/db';

const formFactors = {
  0: "Smartphone",
  1: "Tablet",
  2: "PC",
  3: "Smartwatch",
  4: "Console",
  5: "Smart-tv",
};
export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  try {
    const deviceData = req.body.device;
    const osId = req.body.operating_system;

    let sql = `
		SELECT os.display_name as version, os.version_number, plat.id as platformId, plat.name as name
		FROM wp_appq_evd_platform plat
		         JOIN wp_appq_os os ON (os.platform_id = plat.id)
		WHERE os.id = ?;`;

    const osList = await db.query(db.format(sql, [osId]));
    if (!osList.length) throw Error("Invalid os");

    const os = osList[0];

    let deviceList = [];
    const newDeviceData: { [key: string]: string | number } = {
      id_profile: req.user.testerId,
      enabled: 1,
    };
    if (typeof deviceData === "number") {
      let deviceSql = `SELECT manufacturer,model,device_type as type
           FROM wp_dc_appq_devices 
           WHERE id = ?`;
      try {
        deviceList = await db.query(db.format(deviceSql, [deviceData]));
        if (!deviceList.length) throw Error("Invalid device");
        const device = deviceList[0];
        newDeviceData.source_id = deviceData;
        newDeviceData.os_version_id = osId;
        newDeviceData.manufacturer = device.manufacturer;
        newDeviceData.model = device.model;
        // TODO: Temporary workaround for wordpress
        newDeviceData.form_factor = "?";
        if (formFactors[device.type as keyof typeof formFactors]) {
          newDeviceData.form_factor =
            formFactors[device.type as keyof typeof formFactors];
        }
        newDeviceData.operating_system = os.name;
        newDeviceData.os_version = `${os.version} (${os.version_number})`;
        newDeviceData.platform_id = os.platformId;
        // ENDTODO
      } catch (e) {
        throw Error("Invalid device");
      }
    } else {
      newDeviceData.pc_type = deviceData;
      newDeviceData.os_version_id = osId;
      // TODO: Temporary workaround for wordpress
      newDeviceData.form_factor = "PC";
      newDeviceData.operating_system = os.name;
      newDeviceData.os_version = os.version;
      newDeviceData.platform_id = os.platformId;
      // ENDTODO
    }
    const insertId = await db.insert("wp_crowd_appq_device", newDeviceData);

    let checkSql = `
					SELECT dv.id, dv.form_factor as deviceType, dv.manufacturer, dv.model, dv.pc_type, os.display_name as osVersion, plat.name as os,dv.os_version_id  as os_id
			FROM wp_crowd_appq_device dv
							 JOIN wp_appq_evd_platform plat ON (dv.platform_id = plat.id)
							 JOIN wp_appq_os os ON (dv.os_version_id = os.id)
							 JOIN wp_appq_evd_profile p ON (p.id = dv.id_profile)
					`;
    let where = ` dv.id = ? `;
    let queryData = [insertId];

    checkSql = `${checkSql} WHERE ${where}`;
    sql = db.format(checkSql, queryData);

    const devices = await db.query(sql);
    if (!devices.length) throw Error("Error retrieving newly created device");

    res.status_code = 200;
    return {
      type: devices[0].deviceType,
      id: devices[0].id,
      device: {
        manufacturer: devices[0].manufacturer,
        model: devices[0].model,
        pc_type: devices[0].pc_type
          ? devices[0].pc_type.charAt(0).toUpperCase() +
            devices[0].pc_type.slice(1)
          : undefined,
      },
      operating_system: {
        id: devices[0].os_id,
        platform: devices[0].os,
        version: devices[0].osVersion,
      },
    };
  } catch (error) {
    res.status_code = 404;
    return {
      element: "devices",
      id: parseInt(req.user.ID),
      message: (error as OpenapiError).message,
    };
  }
};
