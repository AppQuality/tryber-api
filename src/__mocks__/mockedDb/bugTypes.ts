import Table from "./table";

type BugTypeParams = {
  id?: number;
  name?: string;
  is_enabled?: 0 | 1;
};
class BugType extends Table<BugTypeParams> {
  protected name = "wp_appq_evd_bug_type";
  protected columns = [
    "id INTEGER PRIMARY KEY",
    "name VARCHAR(255)",
    "is_enabled INTEGER DEFAULT 1",
  ];
  constructor() {
    super({
      id: 1,
      name: "Test Bug Type",
      is_enabled: 1,
    });
  }
}

const theTable = new BugType();

export default theTable;
