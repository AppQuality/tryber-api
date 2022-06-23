import Table from "./table";

type CustomReplicabilityParams = {
  id?: number;
  campaign_id?: number;
  bug_replicability_id?: number;
};
class CustomReplicability extends Table<CustomReplicabilityParams> {
  protected name = "wp_appq_additional_bug_replicabilities";
  protected columns = [
    "id INTEGER PRIMARY KEY",
    "campaign_id INTEGER(11)",
    "bug_replicability_id INTEGER(11)",
  ];
  constructor() {
    super({
      id: 1,
      campaign_id: 1,
      bug_replicability_id: 1,
    });
  }
}

const theTable = new CustomReplicability();

export default theTable;
