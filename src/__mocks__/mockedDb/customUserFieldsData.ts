import Table from "./table";

type CustomUserFieldExtrasParams = {
  id?: number;
  profile_id?: number;
  value?: string;
  custom_user_field_id?: number;
  candidate?: 0 | 1;
};

class CustomUserFieldExtras extends Table<CustomUserFieldExtrasParams> {
  protected name = "wp_appq_custom_user_field_data";
  protected columns = [
    "id INTEGER PRIMARY KEY",
    "profile_id INTEGER NOT NULL",
    "value VARCHAR(512)",
    "custom_user_field_id INTEGER",
    "candidate BOOL",
  ];
  constructor() {
    super({
      id: 1,
      custom_user_field_id: 1,
      profile_id: 1,
      candidate: 0,
    });
  }
}

const theTable = new CustomUserFieldExtras();

export default theTable;
