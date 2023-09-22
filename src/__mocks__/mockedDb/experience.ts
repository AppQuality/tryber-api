// import sqlite3 from "@src/features/sqlite";
import Table from "./table";

type ExperienceParams = {
  id?: number;
  tester_id?: number;
  amount?: number;
  creation_date?: string;
  activity_id?: number;
  reason?: string;
  campaign_id?: number;
  pm_id?: number;
};
const defaultItem: ExperienceParams = {
  id: 1,
  tester_id: 1,
  amount: 1,
  creation_date: new Date().toISOString().split(".")[0].replace("T", " "),
  activity_id: 0,
  reason: "Experience attribution Reason",
  campaign_id: 1,
  pm_id: 1,
};

class Experience extends Table<ExperienceParams> {
  protected name = "wp_appq_exp_points";
  protected columns = [
    "id INTEGER PRIMARY KEY",
    "tester_id INTEGER",
    "amount DECIMAL(11,0)",
    "creation_date TIMESTAMP",
    "activity_id INTEGER",
    "reason VARCHAR(255)",
    "campaign_id INTEGER",
  ];
  constructor() {
    super(defaultItem);
  }
}

const theTable = new Experience();

export default theTable;
export type { ExperienceParams };
