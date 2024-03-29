import Table from "./table";

type PreselectionFormFieldsParams = {
  id?: number;
  form_id?: number;
  type?:
    | "text"
    | "select"
    | "multiselect"
    | "radio"
    | "gender"
    | "phone_number"
    | "address"
    | `cuf_${number}`;
  options?: string;
  question?: string;
  short_name?: string;
  priority?: number;
};
const defaultItem: PreselectionFormFieldsParams = {
  id: 1,
  form_id: 1,
  question: "The question",
  type: "text",
  priority: 1,
};
class PreselectionFormFields extends Table<PreselectionFormFieldsParams> {
  protected name = "wp_appq_campaign_preselection_form_fields";
  protected columns = [
    "id INTEGER PRIMARY KEY",
    "form_id INTEGER",
    "question VARCHAR(511)",
    "short_name VARCHAR(255)",
    "type VARCHAR(255)",
    "options TEXT",
    "priority INTEGER",
  ];
  constructor() {
    super(defaultItem);
  }
}
const preselectionFormFields = new PreselectionFormFields();
export default preselectionFormFields;
export type { PreselectionFormFieldsParams };
