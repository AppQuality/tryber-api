import Table from "./table";

type CandidacyParams = {
  user_id?: number;
  campaign_id?: number;
  subscription_date?: string;
  accepted?: number;
  devices?: string;
  selected_device?: number;
  results?: number;
  modified?: string;
  group_id?: number;
};

class Candidature extends Table<CandidacyParams> {
  protected columns = [
    "user_id INTEGER(11) NOT NULL PRIMARY KEY",
    "campaign_id INTEGER(11)",
    "subscription_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP",
    "accepted INTEGER(1)",
    "devices VARCHAR(600) NOT NULL DEFAULT 0",
    "selected_device INTEGER(100) NOT NULL DEFAULT 0",
    "results INTEGER(11) NOT NULL DEFAULT 0",
    "modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
    "group_id INTEGER(1) NOT NULL DEFAULT 1",
  ];
  protected name = "wp_crowd_appq_has_candidate";

  constructor() {
    super({
      user_id: 1,
      campaign_id: 1,
      subscription_date: new Date("01/01/2021").toISOString(),
      accepted: 0,
      devices: "",
      selected_device: 0,
      results: 0,
      modified: new Date("01/01/2021").toISOString(),
      group_id: 1,
    });
  }
}

const theTable = new Candidature();

export default theTable;
