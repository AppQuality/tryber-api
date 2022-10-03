import Database from "./Database";

type TesterDeviceType = {
  id: number;
  id_profile: number;
  platform_id: number;
};

class TesterDeviceObject {
  id: number;
  id_profile: number;
  platform_id: number;

  constructor(item: TesterDeviceType) {
    this.id = item.id;
    this.id_profile = item.id_profile;
    this.platform_id = item.platform_id;
  }
}

class TesterDevices extends Database<{
  fields: TesterDeviceType;
}> {
  constructor(fields?: TesterDevices["fields"][number][] | ["*"]) {
    super({
      table: "wp_crowd_appq_device",
      primaryKey: "id",
      fields: fields ? fields : ["id", "id_profile", "platform_id"],
    });
  }

  public createObject(row: TesterDeviceType): TesterDeviceObject {
    return new TesterDeviceObject(row);
  }
}
export default TesterDevices;
export { TesterDeviceObject };
