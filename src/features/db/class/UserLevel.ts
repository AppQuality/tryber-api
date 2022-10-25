import Database from "./Database";

type UserLevelType = {
  id?: number;
  tester_id?: number;
  level_id?: number;
};

class UserLevelObject implements UserLevelType {
  id?: number;
  tester_id?: number;
  level_id?: number;

  constructor(item: UserLevelType) {
    this.id = item.id;
    this.tester_id = item.tester_id;
    this.level_id = item.level_id;
  }
}

class UserLevel extends Database<{
  fields: UserLevelType;
}> {
  constructor(fields?: UserLevel["fields"][number][] | ["*"]) {
    super({
      table: "wp_appq_activity_level",
      primaryKey: "id",
      fields: fields ? fields : ["id", "tester_id", "level_id"],
    });
  }

  public createObject(row: UserLevelType): UserLevelObject {
    return new UserLevelObject(row);
  }
}
export default UserLevel;
export { UserLevelObject };
