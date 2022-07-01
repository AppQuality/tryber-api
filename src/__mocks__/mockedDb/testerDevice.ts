import Table from "./table";

type TesterDeviceParams = {
  id?: number;
  id_profile?: number;
  enabled?: number;
  form_factor?: string;
  model?: string;
  manufacturer?: string;
  pc_type?: string;
  os_version_id?: number;
  source_id?: number;
  platform_id?: number;
};

class TesterDevice extends Table<TesterDeviceParams> {
  protected columns = [
    "id INTEGER PRIMARY KEY",
    "form_factor VARCHAR(255)",
    "model VARCHAR(255)",
    "manufacturer VARCHAR(255)",
    "pc_type VARCHAR(255)",
    "os_version_id INTEGER",
    "id_profile INTEGER",
    "source_id INTEGER",
    "platform_id INTEGER",
    "enabled INTEGER",
  ];
  protected name = "wp_crowd_appq_device";
  constructor() {
    super({
      id: 1,
      form_factor: "",
      model: "",
      manufacturer: "",
      pc_type: "",
      os_version_id: 0,
      id_profile: 0,
      source_id: 0,
      platform_id: 0,
      enabled: 0,
    });
  }
}

const theTable = new TesterDevice();

export default theTable;
