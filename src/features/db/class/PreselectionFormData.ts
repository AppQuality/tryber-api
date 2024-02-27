import Database from "./Database";

type PreselectionFormDataType = {
  id: number;
  campaign_id: number;
  tester_id: number;
  field_id: number;
  value: string;
  submission_date: string;
};

class PreselectionFormData extends Database<{
  fields: PreselectionFormDataType;
}> {
  constructor(fields?: PreselectionFormData["fields"][number][] | ["*"]) {
    super({
      table: "wp_appq_campaign_preselection_form_data",
      primaryKey: "id",
      fields: fields
        ? fields
        : [
            "id",
            "campaign_id",
            "field_id",
            "value",
            "tester_id",
            "submission_date",
          ],
    });
  }
}
export default PreselectionFormData;
