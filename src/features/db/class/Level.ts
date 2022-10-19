import Database from "./Database";

type LevelType = {
  id?: number;
  name?: string;
};

class LevelObject implements LevelType {
  id?: number;
  name?: string;

  constructor(item: LevelType) {
    this.id = item.id;
    this.name = item.name;
  }
}

class Level extends Database<{
  fields: LevelType;
}> {
  constructor(fields?: Level["fields"][number][] | ["*"]) {
    super({
      table: "wp_appq_activity_level_definition",
      primaryKey: "id",
      fields: fields ? fields : ["id", "name"],
    });
  }

  public createObject(row: LevelType): LevelObject {
    return new LevelObject(row);
  }
}
export default Level;
export { LevelObject };
