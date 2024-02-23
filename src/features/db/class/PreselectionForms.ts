import Database from "./Database";
class Table extends Database<{
  fields: {
    id: number;
    name: string;
    campaign_id: number;
    author: number;
    creation_date: string;
  };
}> {
  constructor(fields?: Table["fields"][number][] | ["*"]) {
    super({
      table: "wp_appq_campaign_preselection_form",
      primaryKey: "id",
      fields: fields
        ? fields
        : ["id", "name", "campaign_id", "author", "creation_date"],
    });
  }
}
export default Table;
