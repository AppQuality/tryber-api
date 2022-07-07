import Table from "./table";

type CampaignAdditionalsParams = {
  id?: number;
  cp_id?: number;
  slug?: string;
  title?: string;
  type?: string;
  validation?: string;
  error_message?: string;
};
class CampaignAdditionals extends Table<CampaignAdditionalsParams> {
  protected name = "wp_appq_campaign_additional_fields";
  protected columns = [
    "id INTEGER(11) PRIMARY KEY",
    "cp_id INTEGER(11)",
    "slug VARCHAR(255)",
    "title VARCHAR(255)",
    "type VARCHAR(255)",
    "validation VARCHAR(255)",
    "error_message VARCHAR(255)",
  ];
  constructor() {
    super({
      id: 1,
      cp_id: 1,
      slug: "test-campaign-field",
      title: "Test Campaign Field",
      type: "regex",
      validation: "[A-Z]",
      error_message: "error",
    });
  }
}

const theTable = new CampaignAdditionals();

export default theTable;
