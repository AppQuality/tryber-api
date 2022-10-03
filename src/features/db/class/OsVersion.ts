import Database from "./Database";

type OsVersionType = {
  id: number;
  display_name: string;
  version_number: string;
};

class OsVersionObject {
  id: number;
  display_name: string;
  version_number: string;

  constructor(item: OsVersionType) {
    this.id = item.id;
    this.display_name = item.display_name;
    this.version_number = item.version_number;
  }
}

class OsVersion extends Database<{
  fields: OsVersionType;
}> {
  constructor(fields?: OsVersion["fields"][number][] | ["*"]) {
    super({
      table: "wp_appq_os",
      primaryKey: "id",
      fields: fields ? fields : ["id", "display_name", "version_number"],
    });
  }

  public createObject(row: OsVersionType): OsVersionObject {
    return new OsVersionObject(row);
  }
}
export default OsVersion;
export { OsVersionObject };
