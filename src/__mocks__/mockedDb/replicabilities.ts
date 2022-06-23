import Table from "./table";

type ReplicabilityParams = {
  id?: number;
  name?: string;
};
class Replicability extends Table<ReplicabilityParams> {
  protected name = "wp_appq_evd_replicability";
  protected columns = ["id INTEGER PRIMARY KEY", "name VARCHAR(255)"];
  constructor() {
    super({
      id: 1,
      name: "Test Replicability",
    });
  }
}

const theTable = new Replicability();

export default theTable;
