import Table from "./table";

type PreselectionFormDataParams = {
  id?: number;
  tester_id?: number;
  campaign_id?: number;
  field_id?: number;
  value?: string;
  submission_date?: string;
};
const defaultItem: PreselectionFormDataParams = {
  id: 1,
  field_id: 0,
  value: "",
  tester_id: 1,
  campaign_id: 1,
  submission_date: getFormattedToday(),
};
class PreselectionFormData extends Table<PreselectionFormDataParams> {
  protected name = "wp_appq_campaign_preselection_form_data";
  protected columns = [
    "id INTEGER PRIMARY KEY",
    "campaign_id INTEGER",
    "tester_id INTEGER",
    "field_id INTEGER",
    "value TEXT",
    "submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
  ];
  constructor() {
    super(defaultItem);
  }
}

function getFormattedToday() {
  let currentDate = new Date();

  // format: "yyyy-mm-dd hh:MM:ss"
  return (
    currentDate.getFullYear() +
    "-" +
    padZero(currentDate.getMonth() + 1) +
    "-" +
    padZero(currentDate.getDate()) +
    " " +
    padZero(currentDate.getHours()) +
    ":" +
    padZero(currentDate.getMinutes()) +
    ":" +
    padZero(currentDate.getSeconds())
  );

  // add first zero when number is less than 10
  function padZero(number: number) {
    return (number < 10 ? "0" : "") + number;
  }
}
const preselectionForm = new PreselectionFormData();
export default preselectionForm;
export type { PreselectionFormDataParams };
