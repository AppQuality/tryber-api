import Table from "./table";

type AdditionalSeverityParams = {
  id?: number;
  campaign_id?: number;
  bug_severity_id?: number;
};
class AdditionalSeverity extends Table<AdditionalSeverityParams> {
  protected name = "wp_appq_additional_bug_severities";
  protected columns = [
    "id INTEGER PRIMARY KEY",
    "campaign_id INTEGER",
    "bug_severity_id INTEGER",
  ];
  constructor() {
    super({
      id: 1,
      campaign_id: 1,
      bug_severity_id: 1,
    });
  }
}

const theTable = new AdditionalSeverity();

export default theTable;
