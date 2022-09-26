import Table from "./table";

type PageAccessParams = {
  id?: number;
  tester_id?: number;
  view_id?: number;
};
class PageAccess extends Table<PageAccessParams> {
  protected name = "wp_appq_lc_access";
  protected columns = [
    "id INTEGER(11) PRIMARY KEY",
    "tester_id INTEGER(11)",
    "view_id INTEGER(11)",
  ];
  constructor() {
    super({
      id: 1,
      tester_id: 0,
      view_id: 0,
    });
  }
}

const theTable = new PageAccess();

export default theTable;
