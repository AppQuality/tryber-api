import Table from "./table";

type CUFParams = {
  id?: number;
  name?: string;
  type?: string;
  enabled?: number;
  options?: string;
};

class CustomUserFields extends Table<CUFParams> {
  protected name = "wp_appq_custom_user_field";
  protected columns = [
    "id INTEGER PRIMARY KEY",
    "name VARCHAR(128)",
    "type VARCHAR(11)",
    "enabled INTEGER",
    "options TEXT",
  ];
  constructor() {
    super({
      id: 1,
      name: "CUF name",
      enabled: 1,
      type: "text",
    });
  }
}

const theTable = new CustomUserFields();

export default theTable;
