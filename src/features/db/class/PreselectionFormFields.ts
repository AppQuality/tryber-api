import Database from "./Database";
class Table extends Database<{
  fields: {
    id: number;
    short_name: string;
    form_id: number;
    type:
      | "text"
      | "select"
      | "multiselect"
      | "radio"
      | "gender"
      | "phone_number"
      | "address"
      | `cuf_${number}`;
    options: string;
    question: string;
    priority: number;
  };
}> {
  constructor(fields?: Table["fields"][number][] | ["*"]) {
    super({
      table: "wp_appq_campaign_preselection_form_fields",
      primaryKey: "id",
      fields: fields
        ? fields
        : [
            "id",
            "form_id",
            "short_name",
            "type",
            "options",
            "question",
            "priority",
          ],
    });
  }
}
export default Table;
