import Database from "./Database";
class Table extends Database<{
  fields: { id: number; short_name: string; form_id: number };
}> {
  constructor(fields?: Table["fields"][number][] | ["*"]) {
    super({
      table: "wp_appq_campaign_preselection_form_fields",
      primaryKey: "id",
      fields: fields ? fields : ["id", "form_id", "short_name"],
    });
  }
}
export default Table;
