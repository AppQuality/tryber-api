import Table from "./table";

type UseCasesParams = {
  id?: number;
  title?: string;
  campaign_id?: number;
  group_id?: number;
  position?: number;
};
class UseCases extends Table<UseCasesParams> {
  protected name = "wp_appq_campaign_task";
  protected columns = [
    "id INTEGER PRIMARY KEY",
    "title VARCHAR(255)",
    "campaign_id INTEGER(11)",
    "group_id INTEGER(11)",
    "position INTEGER(11)",
  ];
  constructor() {
    super({
      id: 1,
      title: "My Usecase",
      campaign_id: 1,
      group_id: -1,
      position: 0,
    });
  }
}

const theTable = new UseCases();

export default theTable;
