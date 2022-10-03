import Database from "./Database";

type OsType = {
  id: number;
  name: string;
};

class OsObject {
  id: number;
  name: string;

  constructor(item: OsType) {
    this.id = item.id;
    this.name = item.name;
  }
}

class Os extends Database<{
  fields: OsType;
}> {
  constructor(fields?: Os["fields"][number][] | ["*"]) {
    super({
      table: "wp_appq_evd_platform",
      primaryKey: "id",
      fields: fields ? fields : ["id", "name"],
    });
  }

  public createObject(row: OsType): OsObject {
    return new OsObject(row);
  }
}
export default Os;
export { OsObject };
