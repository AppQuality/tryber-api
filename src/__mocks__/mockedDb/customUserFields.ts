import Table from "./table";

type CUFParams = {
  id?: number;
  name?: string;
  slug?: string;
  extras?: string;
  placeholder?: string;
  custom_user_field_group_id?: number;
  type?: string;
  enabled?: number;
  options?: string;
  allow_other?: 1 | 0;
};

class CustomUserFields extends Table<CUFParams> {
  protected name = "wp_appq_custom_user_field";
  protected columns = [
    "id INTEGER PRIMARY KEY",
    "name VARCHAR(128)",
    "type VARCHAR(11)",
    "enabled INTEGER",
    "allow_other INTEGER",
    "options TEXT",
  ];
  constructor() {
    super({
      id: 1,
      slug: "",
      placeholder: "",
      extras: "",
      name: "CUF name",
      enabled: 1,
      custom_user_field_group_id: 0,
      type: "text",
      allow_other: 0,
    });
  }
}

const theTable = new CustomUserFields();

export default theTable;
