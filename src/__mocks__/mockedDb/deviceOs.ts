import Table from "./table";

type DeviceOsParams = {
  id?: number;
  display_name?: string;
  version_number?: string;
  platform_id?: number;
  main_release?: number;
  version_family?: string;
};

class DeviceOs extends Table<DeviceOsParams> {
  protected columns = [
    "id INTEGER PRIMARY KEY",
    "display_name VARCHAR(255)",
    "version_number VARCHAR(255)",
  ];
  protected name = "wp_appq_os";
  constructor() {
    super({
      id: 1,
      display_name: "OS",
      version_number: "1.0",
      platform_id: 0,
      main_release: 0,
      version_family: "",
    });
  }
}

const theTable = new DeviceOs();
export default theTable;
