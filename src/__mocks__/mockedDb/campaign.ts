import Table from "./table";

type CampaignParams = {
  id?: number;
  title?: string;
  min_allowed_media?: number;
  campaign_type?: -1 | 0 | 1;
  bug_lang?: 0 | 1;
};
class Campaign extends Table<CampaignParams> {
  protected name = "wp_appq_evd_campaign";
  protected columns = [
    "id INTEGER(11) PRIMARY KEY",
    "title VARCHAR(255)",
    "min_allowed_media INTEGER(11)",
    "campaign_type INTEGER(11)",
    "bug_lang INTEGER(11)",
  ];
  constructor() {
    super({
      id: 1,
      title: "Test Campaign",
      min_allowed_media: 1,
      campaign_type: 0,
      bug_lang: 0,
    });
  }
}

const theTable = new Campaign();

export default theTable;
