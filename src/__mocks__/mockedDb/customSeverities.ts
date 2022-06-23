import Table from "./table";

type CustomSeverityParams = {
  id?: number;
  campaign_id?: number;
  bug_severity_id?: number;
};
class CustomSeverity extends Table<CustomSeverityParams> {
  protected name = "wp_appq_additional_bug_severities";
  protected columns = [
    "id INTEGER PRIMARY KEY",
    "campaign_id INTEGER(11)",
    "bug_severity_id INTEGER(11)",
  ];
  constructor() {
    super({
      id: 1,
      campaign_id: 1,
      bug_severity_id: 1,
    });
  }
}

const theTable = new CustomSeverity();

export default theTable;
