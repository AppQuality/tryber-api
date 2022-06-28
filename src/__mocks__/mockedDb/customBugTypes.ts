import Table from "./table";

type CustomBugTypeParams = {
  id?: number;
  campaign_id?: number;
  bug_type_id?: number;
};
class CustomBugType extends Table<CustomBugTypeParams> {
  protected name = "wp_appq_additional_bug_types";
  protected columns = [
    "id INTEGER PRIMARY KEY",
    "campaign_id INTEGER(11)",
    "bug_type_id INTEGER(11)",
  ];
  constructor() {
    super({
      id: 1,
      campaign_id: 1,
      bug_type_id: 1,
    });
  }
}

const theTable = new CustomBugType();

export default theTable;
