import Table from "./table";

type LevelDataParams = {
  id?: number;
  tester_id?: number;
  level_id?: number;
};

class LevelData extends Table<LevelDataParams> {
  protected name = "wp_appq_activity_level";
  protected columns = [
    "id INTEGER PRIMARY KEY",
    "tester_id INTEGER",
    "level_id INTEGER",
  ];
  constructor() {
    super({
      id: 1,
      tester_id: 1,
      level_id: 10,
    });
  }
}
const theTable = new LevelData();
export default theTable;
