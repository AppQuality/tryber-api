import Table from "./table";

type CustomUserFieldExtrasParams = {
  id?: number;
  name?: string;
};

class CustomUserFieldExtras extends Table<CustomUserFieldExtrasParams> {
  protected name = "wp_appq_custom_user_field_extras";
  protected columns = ["id INTEGER PRIMARY KEY", "name VARCHAR(64)"];
  constructor() {
    super({
      id: 1,
      name: "CUF item name",
    });
  }
}

const theTable = new CustomUserFieldExtras();

export default theTable;
