import Table from "./table";

type SeverityParams = {
  id?: number;
  name?: string;
};
class Severity extends Table<SeverityParams> {
  protected name = "wp_appq_evd_severity";
  protected columns = ["id INTEGER PRIMARY KEY", "name VARCHAR(255)"];
  constructor() {
    super({
      id: 1,
      name: "Test Severity",
    });
  }
}

const theTable = new Severity();

export default theTable;
