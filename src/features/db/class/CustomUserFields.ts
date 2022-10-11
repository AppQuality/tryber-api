import Database from "./Database";

type CustomUserFieldType = {
  id: number;
  name: string;
  type: string;
  options: string;
};

class CustomUserFieldObject {
  id: number;
  name: string;
  type: string;
  options: string;
  constructor(item: CustomUserFieldType) {
    this.id = item.id;
    this.name = item.name;
    this.type = item.type;
    this.options = item.options;
  }
}

class CustomUserFields extends Database<{
  fields: CustomUserFieldType;
}> {
  constructor(fields?: CustomUserFields["fields"][number][] | ["*"]) {
    super({
      table: "wp_appq_custom_user_field",
      primaryKey: "id",
      fields: fields ? fields : ["id", "name", "type", "options"],
    });
  }

  public createObject(row: CustomUserFieldType): CustomUserFieldObject {
    return new CustomUserFieldObject(row);
  }
}
export default CustomUserFields;
export { CustomUserFieldObject };
