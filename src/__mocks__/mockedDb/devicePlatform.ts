import Table from "./table";

type DevicePlatformParams = {
  id?: number;
  name?: string;
};

class DevicePlatform extends Table<DevicePlatformParams> {
  protected columns = ["id INTEGER PRIMARY KEY", "name VARCHAR(255)"];
  protected name = "wp_appq_evd_platform";
  constructor() {
    super({
      id: 1,
      name: "Platform",
    });
  }
}

const theTable = new DevicePlatform();

export default theTable;
