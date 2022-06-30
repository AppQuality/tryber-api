import Table from "./table";

type AdditionalReplicabilitiesParams = {
  id?: number;
  campaign_id?: number;
  bug_replicability_id?: number;
};
class AdditionalReplicability extends Table<AdditionalReplicabilitiesParams> {
  protected name = "wp_appq_additional_bug_replicabilities";
  protected columns = [
    "id INTEGER PRIMARY KEY",
    "campaign_id INTEGER",
    "bug_replicability_id INTEGER",
  ];
  constructor() {
    super({
      id: 1,
      campaign_id: 1,
      bug_replicability_id: 1,
    });
  }
}

const theTable = new AdditionalReplicability();

export default theTable;
