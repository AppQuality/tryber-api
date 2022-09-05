import Table from "./table";

type PreselectionFormParams = {
  id?: number;
  campaign_id?: number;
  name?: string;
};
const defaultItem: PreselectionFormParams = {
  id: 1,
  name: "",
};
class PreselectionForm extends Table<PreselectionFormParams> {
  protected name = "wp_appq_campaign_preselection_form";
  protected columns = [
    "id INTEGER PRIMARY KEY",
    "campaign_id INTEGER",
    "name VARCHAR(255)",
  ];
  constructor() {
    super(defaultItem);
  }
}
const preselectionForm = new PreselectionForm();
export default preselectionForm;
export type { PreselectionFormParams };
