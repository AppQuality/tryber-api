import Table from "./table";

type UseCasesGroupsParams = {
  task_id?: number;
  group_id?: number;
};
class UseCasesGroups extends Table<UseCasesGroupsParams> {
  protected name = "wp_appq_campaign_task_group";
  protected columns = ["task_id INTEGER ", "group_id INTEGER(11)"];
  constructor() {
    super({
      task_id: 1,
      group_id: 0,
    });
  }
}

const theTable = new UseCasesGroups();

export default theTable;
