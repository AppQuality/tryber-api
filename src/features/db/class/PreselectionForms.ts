import Database from "./Database";
class Table extends Database<{
  fields: { id: number; name: string; campaign_id: number };
}> {
  constructor(fields?: Table["fields"][number][] | ["*"]) {
    super({
      table: "wp_appq_campaign_preselection_form",
      primaryKey: "id",
      fields: fields ? fields : ["id", "name", "campaign_id"],
    });
  }
}
export default Table;
