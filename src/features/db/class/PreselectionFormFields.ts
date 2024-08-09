import Database from "./Database";

type PreselectionFormFieldsType = {
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
  invalid_options: string;
  question: string;
  priority: number;
};

class PreselectionFormFieldsObject {
  id: number;
  short_name: PreselectionFormFieldsType["short_name"];
  form_id: PreselectionFormFieldsType["form_id"];
  type: PreselectionFormFieldsType["type"];
  options: PreselectionFormFieldsType["options"];
  question: PreselectionFormFieldsType["question"];
  priority: PreselectionFormFieldsType["priority"];
  invalid_options: PreselectionFormFieldsType["invalid_options"];

  constructor(item: PreselectionFormFieldsType) {
    this.id = item.id;
    this.short_name = item.short_name;
    this.form_id = item.form_id;
    this.type = item.type;
    this.options = item.options;
    this.question = item.question;
    this.priority = item.priority;
    this.invalid_options = item.invalid_options;
  }

  public getOptions(): string[] | number[] {
    try {
      return JSON.parse(this.options);
    } catch (e) {
      return [];
    }
  }
}

class Table extends Database<{
  fields: PreselectionFormFieldsType;
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
            "invalid_options",
          ],
    });
  }

  public createObject(
    row: PreselectionFormFieldsType
  ): PreselectionFormFieldsObject {
    return new PreselectionFormFieldsObject(row);
  }
}
export default Table;
export { PreselectionFormFieldsObject };
