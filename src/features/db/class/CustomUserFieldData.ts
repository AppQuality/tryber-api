import Database from "./Database";

type CustomUserFieldDataType = {
  id: number;
  custom_user_field_id: number;
  profile_id: number;
  value: string;
};

class CustomUserFieldDataObject {
  id: number;
  custom_user_field_id: number;
  profile_id: number;
  value: string;

  constructor(item: CustomUserFieldDataType) {
    this.id = item.id;
    this.custom_user_field_id = item.custom_user_field_id;
    this.profile_id = item.profile_id;
    this.value = item.value;
  }
}

class CustomUserFieldDatas extends Database<{
  fields: CustomUserFieldDataType;
}> {
  constructor(fields?: CustomUserFieldDatas["fields"][number][] | ["*"]) {
    super({
      table: "wp_appq_custom_user_field_data",
      primaryKey: "id",
      fields: fields
        ? fields
        : ["id", "custom_user_field_id", "profile_id", "value"],
    });
  }

  public createObject(row: CustomUserFieldDataType): CustomUserFieldDataObject {
    return new CustomUserFieldDataObject(row);
  }
}
export default CustomUserFieldDatas;
export { CustomUserFieldDataObject };
