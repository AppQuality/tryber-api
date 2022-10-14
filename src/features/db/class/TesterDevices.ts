import Database from "./Database";
import Os from "./Os";
import OsVersion from "./OsVersion";

type TesterDeviceType = {
  id: number;
  id_profile: number;
  platform_id: number;
  os_version_id: number;
  form_factor: string;
  pc_type: string;
  source_id: number;
  manufacturer: string;
  model: string;
  enabled: 0 | 1;
};

class TesterDeviceObject {
  id: number;
  id_profile: number;
  platform_id: number;
  os_version_id: number;
  form_factor: string;
  pc_type: string;
  source_id: number;
  manufacturer: string;
  model: string;
  enabled: 0 | 1;

  constructor(item: TesterDeviceType) {
    this.id = item.id;
    this.id_profile = item.id_profile;
    this.platform_id = item.platform_id;
    this.os_version_id = item.os_version_id;
    this.form_factor = item.form_factor;
    this.pc_type = item.pc_type;
    this.source_id = item.source_id;
    this.manufacturer = item.manufacturer;
    this.model = item.model;
    this.enabled = item.enabled;
  }

  async getFull() {
    const os = new Os();
    const osData = await os.get(this.platform_id);
    const osVersion = new OsVersion();
    const osVersionData = await osVersion.get(this.os_version_id);
    return {
      id: this.id,
      type: this.form_factor,
      device:
        this.form_factor === "PC" && this.pc_type
          ? {
              pc_type: this.pc_type,
            }
          : {
              id: this.source_id,
              manufacturer: this.manufacturer,
              model: this.model,
            },
      operating_system: {
        id: this.os_version_id,
        platform: osData.name,
        version: `${osVersionData.display_name} (${osVersionData.version_number})`,
      },
    };
  }
}

class TesterDevices extends Database<{
  fields: TesterDeviceType;
}> {
  constructor(fields?: TesterDevices["fields"][number][] | ["*"]) {
    super({
      table: "wp_crowd_appq_device",
      primaryKey: "id",
      fields: fields
        ? fields
        : [
            "id",
            "id_profile",
            "platform_id",
            "os_version_id",
            "form_factor",
            "manufacturer",
            "model",
            "enabled",
            "pc_type",
            "source_id",
          ],
    });
  }

  public createObject(row: TesterDeviceType): TesterDeviceObject {
    return new TesterDeviceObject(row);
  }

  protected constructSelectQuery(params: any) {
    const a = super.constructSelectQuery(params);
    console.log(a);
    return a;
  }
}
export default TesterDevices;
export { TesterDeviceObject };
