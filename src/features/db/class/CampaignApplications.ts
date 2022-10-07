import Database from "./Database";

type CampaignApplicationType = {
  user_id: number;
  campaign_id: number;
  subscription_date: string;
  accepted: 0 | 1;
  devices: string;
  selected_device: number;
  results: number;
  group_id: number;
};

class CampaignApplicationObject {
  user_id: number;
  campaign_id: number;
  subscription_date: string;
  accepted: 0 | 1;
  devices: string;
  selected_device: number;
  results: number;
  group_id: number;

  constructor(item: CampaignApplicationType) {
    this.user_id = item.user_id;
    this.campaign_id = item.campaign_id;
    this.subscription_date = item.subscription_date;
    this.accepted = item.accepted;
    this.devices = item.devices;
    this.selected_device = item.selected_device;
    this.results = item.results;
    this.group_id = item.group_id;
  }
}

class CampaignApplications extends Database<{
  fields: CampaignApplicationType;
}> {
  constructor(fields?: CampaignApplications["fields"][number][] | ["*"]) {
    super({
      table: "wp_crowd_appq_has_candidate",
      primaryKey: null,
      fields: fields
        ? fields
        : [
            "user_id",
            "campaign_id",
            "subscription_date",
            "accepted",
            "devices",
            "selected_device",
            "results",
            "group_id",
          ],
    });
  }

  public createObject(row: CampaignApplicationType): CampaignApplicationObject {
    return new CampaignApplicationObject(row);
  }
}
export default CampaignApplications;
export { CampaignApplicationObject };
