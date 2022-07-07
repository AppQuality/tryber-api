import Table from "./table";

type AdditionalBugTypeParams = {
  id?: number;
  campaign_id?: number;
  bug_type_id?: number;
};
class AdditionalBugType extends Table<AdditionalBugTypeParams> {
  protected name = "wp_appq_additional_bug_types";
  protected columns = [
    "id INTEGER PRIMARY KEY",
    "campaign_id INTEGER",
    "bug_type_id INTEGER",
  ];
  constructor() {
    super({
      id: 1,
      campaign_id: 1,
      bug_type_id: 1,
    });
  }
}

const theTable = new AdditionalBugType();

export default theTable;
