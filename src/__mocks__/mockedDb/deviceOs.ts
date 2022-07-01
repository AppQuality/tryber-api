import Table from "./table";

type DeviceOsParams = {
  id?: number;
  display_name?: string;
  version_number?: string;
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
    });
  }
}

const theTable = new DeviceOs();
export default theTable;
