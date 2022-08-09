import * as db from "@src/features/db";

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
  private baseQuery = `SELECT
    d.id,d.form_factor,d.manufacturer,d.model,d.os_version_id, d.pc_type, d.source_id,
    osVersion.display_name as osVersion, osVersion.version_number as osVersionNumber,
    os.name as os
    FROM wp_crowd_appq_device d
    JOIN wp_appq_os osVersion ON d.os_version_id = osVersion.id
    JOIN wp_appq_evd_platform os ON d.platform_id = os.id
    WHERE d.enabled = 1`;

  private baseOrder = `ORDER BY case when d.form_factor = 'Smartphone' then 1
  when d.form_factor = 'PC' then 2
  when d.form_factor = 'Tablet' then 3
  when d.form_factor = 'Smart-tv' then 4
  else 5
end asc , os.name ASC`;

  public async getOne(id: number): Promise<UserDevice | false> {
    const data = await db.query(
      db.format(`${this.baseQuery} AND d.id = ?`, [id])
    );
    if (!data.length) {
      return false;
    }
    return this.format(data[0]);
  }

  public async getMany(where: { testerId: number }): Promise<UserDevice[]> {
    const { query, data } = mapQuery();
    const results = await db.query(
      db.format(`${this.baseQuery} ${query} ${this.baseOrder}`, [...data])
    );

    return results.map(this.format);

    function mapQuery() {
      const results = Object.keys(where).map((key) => {
        if (key === "testerId") {
          return { query: "d.id_profile = ?", value: where[key] };
        }
        throw new Error("Invalid query");
      });

      return {
        query: "AND " + results.map((r) => r.query).join(" AND "),
        data: results.map((r) => r.value),
      };
    }
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
