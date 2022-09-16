import Table from "./table";

type CampaignParams = {
  id?: number;
  title?: string;
  customer_title?: string;
  min_allowed_media?: number;
  campaign_type?: -1 | 0 | 1;
  campaign_type_id?: number;
  bug_lang?: 0 | 1;
  base_bug_internal_id?: string;
  start_date?: string;
  end_date?: string;
  close_date?: string;
  os?: string;
  pm_id?: number;
  is_public?: 0 | 1;
  page_preview_id?: number;
  page_manual_id?: number;
};
class Campaign extends Table<CampaignParams> {
  protected name = "wp_appq_evd_campaign";
  protected columns = [
    "id INTEGER(11) PRIMARY KEY",
    "title VARCHAR(255)",
    "customer_title VARCHAR(255)",
    "min_allowed_media INTEGER(11)",
    "campaign_type INTEGER(11)",
    "campaign_type_id INTEGER(11)",
    "bug_lang INTEGER(11)",
    "base_bug_internal_id VARCHAR(255)",
    "start_date VARCHAR(255)",
    "end_date VARCHAR(255)",
    "close_date VARCHAR(255)",
    "os VARCHAR(255)",
    "pm_id INTEGER(11)",
    "is_public BOOLEAN",
    "page_preview_id INTEGER(11)",
    "page_manual_id INTEGER(11)",
  ];
  constructor() {
    super({
      id: 1,
      title: "Test Campaign",
      customer_title: "Test Campaign",
      min_allowed_media: 1,
      campaign_type: 0,
      bug_lang: 0,
      base_bug_internal_id: "I",
      start_date: "2020-01-01",
      end_date: "2020-01-01",
      close_date: "2020-01-01",
      campaign_type_id: 1,
      os: "",
      pm_id: 1,
      is_public: 0,
      page_manual_id: 0,
      page_preview_id: 0,
    });
  }
}

const theTable = new Campaign();

export default theTable;
