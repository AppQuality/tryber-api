import Table from "./table";

type PreselectionFormDataParams = {
  id?: number;
  tester_id?: number;
  campaign_id?: number;
  field_id?: number;
  value?: string;
};
const defaultItem: PreselectionFormDataParams = {
  id: 1,
  field_id: 0,
  value: "",
  tester_id: 1,
  campaign_id: 1,
};
class PreselectionFormData extends Table<PreselectionFormDataParams> {
  protected name = "wp_appq_campaign_preselection_form_data";
  protected columns = [
    "id INTEGER PRIMARY KEY",
    "campaign_id INTEGER",
    "tester_id INTEGER",
    "field_id INTEGER",
    "value TEXT",
  ];
  constructor() {
    super(defaultItem);
  }
}

const preselectionForm = new PreselectionFormData();
export default preselectionForm;
export type { PreselectionFormDataParams };
