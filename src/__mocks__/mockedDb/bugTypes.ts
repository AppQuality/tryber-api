import Table from "./table";

type BugTypeParams = {
  id?: number;
  name?: string;
};
class BugType extends Table<BugTypeParams> {
  protected name = "wp_appq_evd_bug_type";
  protected columns = ["id INTEGER PRIMARY KEY", "name VARCHAR(255)"];
  constructor() {
    super({
      id: 1,
      name: "Test Bug Type",
    });
  }
}

const theTable = new BugType();

export default theTable;
