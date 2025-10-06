import { FORM_FACTOR_KEY } from "@src/constants";
import { UserTargetChecker } from "@src/features/target/UserTargetChecker";
import Database from "./Database";
import { tryber } from "@src/features/database";
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
  campaign_pts?: number;
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
  campaign_pts?: number;

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
    this.campaign_pts = item.campaign_pts;
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

      if (!targetRules) return true;
      return userTargetChecker.inTarget(targetRules);
    }
    return false;
  }

  public async isApplicationAvailable() {
    const today = new Date().toISOString().split(".")[0].replace("T", " ");
    return new Date(this.start_date) >= new Date(today);
  }

  public async getCampaignAvailableDevices() {
    type FFNum = keyof typeof FORM_FACTOR_KEY; // 0|1|2|3|4|5

    type CampaignDevices = {
      smartphone?: { name: string }[] | "all";
      tablet?: { name: string }[] | "all";
      pc?: { name: string }[] | "all";
      console?: { name: string }[] | "all";
      smartTv?: { name: string }[] | "all";
      smartwatch?: { name: string }[] | "all";
    };

    type DeviceRow = { name: string; form_factor: number };

    // campaign available devices
    const cpFormFactor = await tryber.tables.WpAppqEvdCampaign.do()
      .select(tryber.ref("form_factor").withSchema("wp_appq_evd_campaign"))
      .where({ id: this.id })
      .first();

    const splittedFormFactor: number[] = cpFormFactor?.form_factor
      ? String(cpFormFactor.form_factor)
          .split(",")
          .map((f) => Number(f.trim()))
      : [];

    if (splittedFormFactor.length === 0) return {};

    // counting total existing devices by form_factor, limited to the campaign ones
    const totalsRaw = await tryber.tables.WpAppqEvdPlatform.do()
      .select(
        tryber
          .ref("form_factor")
          .withSchema("wp_appq_evd_platform")
          .as("form_factor")
      )
      .countDistinct<{ form_factor: number; total: string }[]>({
        total: tryber.ref("id").withSchema("wp_appq_evd_platform"),
      })
      .whereIn("form_factor", splittedFormFactor)
      .groupBy("form_factor");

    const totalByFF: Record<number, number> = {};

    // how many o.s. are there for each form_factor in our db
    for (const row of totalsRaw) {
      totalByFF[Number(row.form_factor)] = Number(row.total);
    }

    // retrieve devices info (name, form_factor) for the campaign available form_factors and os
    const campaignOSAvailable = await tryber.tables.WpAppqEvdCampaign.do()
      .select(tryber.ref("os").withSchema("wp_appq_evd_campaign"))
      .where({ id: this.id })
      .first();
    const splittedOSAvailable = campaignOSAvailable?.os
      ? campaignOSAvailable.os.split(",").map((os) => Number(os.trim()))
      : [];

    const campaignDevicesInfo: DeviceRow[] =
      await tryber.tables.WpAppqEvdPlatform.do()
        .select(
          tryber.ref("name").withSchema("wp_appq_evd_platform").as("name"),
          tryber
            .ref("form_factor")
            .withSchema("wp_appq_evd_platform")
            .as("form_factor")
        )
        .whereIn("form_factor", splittedFormFactor)
        .whereIn("id", splittedOSAvailable);

    // grouping by form_factor and accumulating os names
    type OSInfo = { osNames: Set<string> };
    const campaignDevicesAccumulation: Record<number, OSInfo> = {};

    for (const d of campaignDevicesInfo) {
      const formFactorId = Number(d.form_factor);
      if (!(formFactorId in campaignDevicesAccumulation)) {
        campaignDevicesAccumulation[formFactorId] = {
          osNames: new Set(),
        };
      }

      campaignDevicesAccumulation[formFactorId].osNames.add(d.name);
    }

    // build the result object with "all" or the list of o.s. names
    const campaignAcceptedDevices: CampaignDevices = {};
    for (const [ffStr, bucket] of Object.entries(campaignDevicesAccumulation)) {
      const ffNumber = Number(ffStr) as FFNum;
      const deviceType = FORM_FACTOR_KEY[ffNumber];
      if (!deviceType) continue;

      const total = totalByFF[ffNumber] ?? 0;

      if (total > 0 && bucket.osNames.size === total) {
        campaignAcceptedDevices[deviceType] = "all";
      } else {
        campaignAcceptedDevices[deviceType] = Array.from(bucket.osNames).map(
          (name) => ({ name })
        );
      }
    }

    return campaignAcceptedDevices;
  }

  public isCampaignV2() {
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
            "page_version",
            "campaign_pts",
          ],
    });
  }

  public createObject(row: CampaignType): CampaignObject {
    return new CampaignObject(row);
  }
}
export default Campaigns;
export { CampaignObject };
