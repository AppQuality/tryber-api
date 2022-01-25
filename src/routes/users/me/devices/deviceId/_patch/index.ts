/** OPENAPI-ROUTE: patch-users-me-devices-deviceId */
import { Context } from "openapi-backend";

import * as db from "../../../../../../features/db";

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  try {
    const deviceId =
      typeof c.request.params.deviceId === "string"
        ? c.request.params.deviceId
        : "0";
    let sql = `
	SELECT dv.id, dv.os_version_id as operating_system
		FROM wp_crowd_appq_device  dv
		JOIN wp_appq_evd_profile p ON (p.id = dv.id_profile)
	`;
    let where = ` p.wp_user_id = ? AND dv.id = ? AND enabled = 1`;
    let queryData = [req.user.ID, deviceId];
    sql = `${sql} WHERE ${where}`;

    const devices = await db.query(db.format(sql, queryData));
    if (!devices.length) throw Error("No device on your user");
    const device = devices[0];
    const { operating_system } = req.body;

    let osVersionNameSql = `
    SELECT os.display_name as version, os.version_number
    FROM wp_appq_os os
    WHERE os.id = ?`;

    const osNames = await db.query(
      db.format(osVersionNameSql, [operating_system])
    );
    if (!osNames.length) throw Error("Invalid os");

    const osName = osNames[0].version;
    const osVersion = osNames[0].version_number;

    const update = `
                    UPDATE wp_crowd_appq_device 
                    SET os_version_id = ?, os_version = concat(?, " (", ? , ")") 
                    WHERE id = ?
                `;
    const updateData = [operating_system, osName, osVersion, deviceId];
    const updateResults = await db.query(db.format(update, updateData));
    const isChanged = updateResults.changedRows != 0;

    let checkSql = `
            SELECT dv.id, dv.form_factor as deviceType, dv.manufacturer, dv.model, dv.pc_type,
             os.display_name as osVersion, plat.name as os,dv.os_version_id  as os_id
    FROM wp_crowd_appq_device dv
                JOIN wp_appq_evd_platform plat ON (dv.platform_id = plat.id)
                JOIN wp_appq_os os ON (dv.os_version_id = os.id)
                JOIN wp_appq_evd_profile p ON (p.id = dv.id_profile)
            WHERE dv.id = ?`;

    const checkDevices = await db.query(db.format(checkSql, [deviceId]));
    if (!checkDevices.length) {
      try {
        await db.query(db.format(update, [device.operating_system, deviceId]));
      } catch (e) {
        throw Error("Error checking your edit, change reverted");
      }
    }
    const deviceRes: {
      manufacturer?: string;
      model?: string;
      id?: string;
      pc_type?: string;
    } = {};
    if (checkDevices[0].manufacturer !== "-" && checkDevices[0].manufacturer)
      deviceRes.manufacturer = checkDevices[0].manufacturer;

    if (checkDevices[0].model !== "-" && checkDevices[0].model) {
      deviceRes.model = checkDevices[0].model;
    }
    if (checkDevices[0].deviceId) {
      deviceRes.id = checkDevices[0].deviceId;
    }
    if (checkDevices[0].pc_type) {
      deviceRes.pc_type =
        checkDevices[0].pc_type.charAt(0).toUpperCase() +
        checkDevices[0].pc_type.slice(1);
    }
    const result = {
      type: checkDevices[0].deviceType,
      id: checkDevices[0].id,
      device: deviceRes,
      operating_system: {
        id: checkDevices[0].os_id,
        platform: checkDevices[0].os,
        version: checkDevices[0].osVersion,
      },
    };
    if (isChanged) {
      res.status_code = 200;
      return result;
    } else {
      throw { status_code: 304, message: result };
    }
  } catch (error) {
    if ((error as OpenapiError).status_code === 304) {
      res.status_code = 304;
      return (error as OpenapiError).message;
    } else {
      res.status_code = (error as OpenapiError).status_code || 400;

      return {
        element: "users",
        id: parseInt(req.user.ID),
        message: (error as OpenapiError).message,
      };
    }
  }
};
