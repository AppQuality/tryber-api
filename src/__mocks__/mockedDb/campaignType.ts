import Table from "./table";

type CampaignTypeParams = {
  id?: number;
  name?: string;
  category_id?: number;
};
class CampaignType extends Table<CampaignTypeParams> {
  protected name = "wp_appq_campaign_type";
  protected columns = [
    "id INTEGER(11) PRIMARY KEY",
    "name VARCHAR(255)",
    "category_id INTEGER(11)",
  ];
  constructor() {
    super({
      id: 1,
      name: "Type",
      category_id: 1,
    });
  }
}

const theTable = new CampaignType();

export default theTable;
