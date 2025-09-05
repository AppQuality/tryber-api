import { UserTargetChecker } from "@src/features/target/UserTargetChecker";
import Database from "./Database";
import PageAccess from "./PageAccess";

type CampaignType = {
  id: number;
  title: string;
  is_public: 0 | 1 | 2 | 3 | 4;
  page_preview_id: string;
  page_manual_id: string;
  status_id: 1 | 2;
  start_date: string;
  end_date: string;
  close_date: string;
  campaign_type_id: number;
  os: string;
  page_version: "v1" | "v2";
};

class CampaignObject {
  id: number;
  title: string;
  is_public: 0 | 1 | 2 | 3 | 4;
  page_preview_id: string;
  page_manual_id: string;
  status_id: 1 | 2;
  start_date: string;
  end_date: string;
  close_date: string;
  campaign_type_id: number;
  os: string;
  page_version: "v1" | "v2";

  constructor(item: CampaignType) {
    this.id = item.id;
    this.title = item.title;
    this.is_public = item.is_public;
    this.page_preview_id = item.page_preview_id;
    this.page_manual_id = item.page_manual_id;
    this.status_id = item.status_id;
    this.start_date = item.start_date;
    this.end_date = item.end_date;
    this.close_date = item.close_date;
    this.campaign_type_id = item.campaign_type_id;
    this.os = item.os;
    this.page_version = item.page_version;
  }

  get visibility_type() {
    return this.is_public;
  }

  get isPublic() {
    return this.is_public === 1;
  }
  get isSmallGroup() {
    return this.is_public === 3;
  }
  get isTarget() {
    return this.is_public === 4;
  }

  get acceptedOs() {
    if (!this.os || this.os === "") return [];
    return this.os.split(",").map((e) => parseInt(e));
  }

  private async getTargetRules() {
    const userTargetChecker = new UserTargetChecker();
    const campaigns = await userTargetChecker.enhanceCampaignsWithTargetRules({
      campaigns: [this],
    });

    const campaign = campaigns[0];
    if (!campaign || !campaign.targetRules) return undefined;
    const targetRules = campaign.targetRules;
    return targetRules;
  }

  public async testerHasAccess(testerId: number) {
    if (this.isPublic) return true;
    if (this.isSmallGroup) {
      const pageAccess = new PageAccess();
      const previewAccess = await pageAccess.query({
        where: [
          { tester_id: testerId },
          { view_id: parseInt(this.page_preview_id) },
        ],
      });
      return previewAccess.length > 0;
    }
    if (this.isTarget) {
      const userTargetChecker = new UserTargetChecker();
      await userTargetChecker.initUser({ testerId });

      const targetRules = await this.getTargetRules();
      await this.getTargetRules();

      if (!targetRules) return true;
      return userTargetChecker.inTarget(targetRules);
    }
    return false;
  }

  public async isApplicationAvailable() {
    const today = new Date().toISOString().split(".")[0].replace("T", " ");
    return new Date(this.start_date) >= new Date(today);
  }

  public async isCampaignV2() {
    return this.page_version === "v2";
  }

  public isOsAccepted(os: number) {
    if (this.acceptedOs.length === 0) return true;
    return this.acceptedOs.includes(os);
  }
}

class Campaigns extends Database<{
  fields: CampaignType;
}> {
  constructor(fields?: Campaigns["fields"][number][] | ["*"]) {
    super({
      table: "wp_appq_evd_campaign",
      primaryKey: "id",
      fields: fields
        ? fields
        : [
            "id",
            "title",
            "is_public",
            "page_preview_id",
            "status_id",
            "start_date",
            "end_date",
            "close_date",
            "os",
          ],
    });
  }

  public createObject(row: CampaignType): CampaignObject {
    return new CampaignObject(row);
  }
}
export default Campaigns;
export { CampaignObject };
