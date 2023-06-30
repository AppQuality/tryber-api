import Table from "./table";

type CustomUserFieldExtrasParams = {
  id?: number;
  name?: string;
  custom_user_field_id?: number;
};

class CustomUserFieldExtras extends Table<CustomUserFieldExtrasParams> {
  protected name = "wp_appq_custom_user_field_extras";
  protected columns = [
    "id INTEGER PRIMARY KEY",
    "name VARCHAR(64)",
    "custom_user_field_id INTEGER",
  ];
  constructor() {
    super({
      id: 1,
      name: "CUF item name",
      custom_user_field_id: 0,
    });
  }
}

const theTable = new CustomUserFieldExtras();

export default theTable;
