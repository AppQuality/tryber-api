import { tryber } from "@src/features/database";

type DeviceType = {
  id: number;
  form_factor: string;
  manufacturer: string;
  model: string;
  os: string;
  osVersion: string;
  osVersionNumber: string;
  os_version_id: number;
  pc_type: string;
  source_id: number;
};
export type UserDevice = StoplightComponents["schemas"]["UserDevice"];

class Devices {
  private baseKnexQuery = tryber.tables.WpCrowdAppqDevice.do()
    .select(
      tryber.ref("id").withSchema("wp_crowd_appq_device"),
      tryber.ref("form_factor").withSchema("wp_crowd_appq_device"),
      tryber.ref("manufacturer").withSchema("wp_crowd_appq_device"),
      tryber.ref("model").withSchema("wp_crowd_appq_device"),
      "os_version_id",
      "pc_type",
      "source_id",
      tryber.ref("wp_appq_os.display_name").as("osVersion"),
      tryber.ref("wp_appq_os.version_number").as("osVersionNumber"),
      tryber.ref("wp_appq_evd_platform.name").as("os")
    )
    .join("wp_appq_os", "wp_crowd_appq_device.os_version_id", "wp_appq_os.id")
    .join(
      "wp_appq_evd_platform",
      "wp_crowd_appq_device.platform_id",
      "wp_appq_evd_platform.id"
    )
    .where("enabled", 1);

  private baseOrder = `case when wp_crowd_appq_device.form_factor = 'Smartphone' then 1
  when wp_crowd_appq_device.form_factor = 'PC' then 2
  when wp_crowd_appq_device.form_factor = 'Tablet' then 3
  when wp_crowd_appq_device.form_factor = 'Smart-tv' then 4
  else 5
end asc , wp_appq_evd_platform.name ASC`;

  public async getOne(id: number): Promise<UserDevice | false> {
    const data = await this.baseKnexQuery.where("wp_crowd_appq_device.id", id);

    if (!data.length) {
      return false;
    }
    return this.format(data[0]);
  }

  public async getMany(where: { testerId: number }): Promise<UserDevice[]> {
    let { testerId, ...rest } = where;
    const query = (
      testerId
        ? this.baseKnexQuery
            .where(rest)
            .where("wp_crowd_appq_device.id_profile", testerId)
        : this.baseKnexQuery.where(rest)
    ).orderByRaw(this.baseOrder);
    const results = await query;

    return results.map(this.format);
  }

  private format(device: DeviceType): {
    id: number;
    type: string;
    device:
      | {
          pc_type: string;
        }
      | {
          id: number;
          manufacturer: string;
          model: string;
        };
    operating_system: {
      id: number;
      platform: string;
      version: string;
    };
  } {
    return {
      id: device.id,
      type: device.form_factor,
      device:
        device.form_factor === "PC"
          ? {
              pc_type: device.pc_type,
            }
          : {
              id: device.source_id,
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
