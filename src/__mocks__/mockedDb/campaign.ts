import Table from "./table";

type CampaignParams = {
  id?: number;
};
class Campaign extends Table<CampaignParams> {
  protected name = "wp_appq_evd_campaign";
  protected columns = ["id INTEGER(11) PRIMARY KEY", "title VARCHAR(255)"];
  constructor() {
    super({
      id: 1,
    });
  }
}

const theTable = new Campaign();

export default theTable;
