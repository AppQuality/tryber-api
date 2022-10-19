import Table from "./table";

type LevelParams = {
  id?: number;
  name?: string;
  reach_exp_pts?: number;
  hold_exp_pts?: number;
};

class Levels extends Table<LevelParams> {
  protected name = "wp_appq_activity_level_definition";
  protected columns = [
    "id INTEGER PRIMARY KEY",
    "name VARCHAR(64)",
    "reach_exp_pts INTEGER",
    "hold_exp_pts INTEGER",
  ];

  constructor() {
    super({
      id: 1,
      name: "Level",
      reach_exp_pts: 1000,
      hold_exp_pts: 2000,
    });
  }
}

const theTable = new Levels();
export default theTable;
