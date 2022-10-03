import Database from "./Database";

type CustomUserFieldExtrasType = {
  id: number;
  name: string;
  custom_user_field_id: number;
};

class CustomUserFieldExtrasObject {
  id: number;
  name: string;
  custom_user_field_id: number;
  constructor(item: CustomUserFieldExtrasType) {
    this.id = item.id;
    this.name = item.name;
    this.custom_user_field_id = item.custom_user_field_id;
  }
}

class CustomUserFieldExtrass extends Database<{
  fields: CustomUserFieldExtrasType;
}> {
  constructor(fields?: CustomUserFieldExtrass["fields"][number][] | ["*"]) {
    super({
      table: "wp_appq_custom_user_field_extras",
      primaryKey: "id",
      fields: fields ? fields : ["id", "name", "custom_user_field_id"],
    });
  }

  public createObject(
    row: CustomUserFieldExtrasType
  ): CustomUserFieldExtrasObject {
    return new CustomUserFieldExtrasObject(row);
  }
}
export default CustomUserFieldExtrass;
export { CustomUserFieldExtrasObject };
