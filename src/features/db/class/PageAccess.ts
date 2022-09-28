import Database from "./Database";
class PageAccess extends Database<{
  fields: {
    id: number;
    tester_id: number;
    view_id: number;
  };
}> {
  constructor(fields?: PageAccess["fields"][number][] | ["*"]) {
    super({
      table: "wp_appq_lc_access",
      primaryKey: "id",
      fields: fields ? fields : ["id", "tester_id", "view_id"],
    });
  }
}
export default PageAccess;
