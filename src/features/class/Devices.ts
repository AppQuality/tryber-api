import * as db from "@src/features/db";
class Devices {
  public async getOne(id: string) {
    const data = await db.query(
      db.format(
        `SELECT 
            d.id,d.form_factor,d.manufacturer,d.model,d.os_version_id,
            osVersion.display_name as osVersion, osVersion.version_number as osVersionNumber,
            os.name as os
          FROM wp_crowd_appq_device d
          JOIN wp_appq_os osVersion ON d.os_version_id = osVersion.id
          JOIN wp_appq_evd_platform os ON d.platform_id = os.id
          WHERE d.id = ? AND d.enabled = 1`,
        [id]
      )
    );
    if (!data.length) {
      throw Error("Invalid device data");
    }
    return this.format(data[0]);
  }

  private format(device) {
    return {
      id: device.id,
      type: device.form_factor,
      device:
        device.form_factor === "PC"
          ? {
              pc_type: "",
            }
          : {
              manufacturer: device.manufacturer,
              model: device.model,
            },
      operating_system: {
        id: device.os_version_id,
        platform: device.os,
        version: `${device.osVersion} (${device.osVersionNumber})`,
      },
    };
  }
}
export default Devices;
