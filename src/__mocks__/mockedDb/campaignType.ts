import Table from "./table";

type CampaignTypeParams = {
  id?: number;
  name?: string;
};
class CampaignType extends Table<CampaignTypeParams> {
  protected name = "wp_appq_campaign_type";
  protected columns = ["id INTEGER(11) PRIMARY KEY", "name VARCHAR(255)"];
  constructor() {
    super({
      id: 1,
      name: "Type",
    });
  }
}

const theTable = new CampaignType();

export default theTable;
