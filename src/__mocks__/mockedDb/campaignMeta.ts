import Table from "./table";

type CampaignMetaParams = {
  meta_id?: number;
  campaign_id?: number;
  meta_key?: string;
  meta_value?: string;
};
class CampaignMeta extends Table<CampaignMetaParams> {
  protected name = "wp_appq_cp_meta";
  protected columns = [
    "meta_id INTEGER(11) PRIMARY KEY",
    "campaign_id INTEGER(11)",
    "meta_key VARCHAR(255)",
    "meta_value VARCHAR(255)",
  ];
  constructor() {
    super({
      meta_id: 1,
      campaign_id: 1,
      meta_key: "test-meta-key",
      meta_value: "test-meta-value",
    });
  }
}

const theTable = new CampaignMeta();

export default theTable;
