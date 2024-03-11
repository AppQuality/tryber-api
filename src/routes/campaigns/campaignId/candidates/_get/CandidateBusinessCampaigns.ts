import { tryber } from "@src/features/database";

class CandidateBusinessCampaigns {
  private candidateIds: number[];
  public allTimeCps:
    | {
        id: number;
        counter: number;
      }[] = [];

  public lastMonthCps:
    | {
        id: number;
        counter: number;
      }[] = [];

  constructor({ candidateIds }: { candidateIds: number[] }) {
    this.candidateIds = candidateIds;
  }
  async init() {
    await this.initAllTimeCps();
    await this.initLastMonthCps();
  }

  private async initAllTimeCps() {
    this.allTimeCps = await tryber.tables.WpAppqEvdBug.do()
      .select(tryber.ref("id").withSchema("wp_appq_evd_profile"))
      .countDistinct({ counter: "wp_appq_evd_campaign.id" })
      .join(
        "wp_appq_evd_profile",
        "wp_appq_evd_bug.wp_user_id",
        "wp_appq_evd_profile.wp_user_id"
      )
      .join(
        "wp_appq_evd_campaign",
        "wp_appq_evd_campaign.id",
        "wp_appq_evd_bug.campaign_id"
      )
      .where("wp_appq_evd_campaign.is_business", 1)
      .whereIn("wp_appq_evd_profile.id", this.candidateIds)
      .groupBy("wp_appq_evd_profile.id");
  }

  private async initLastMonthCps() {
    const last30Days = new Date();
    last30Days.setMonth(last30Days.getMonth() - 1);
    this.lastMonthCps = await tryber.tables.WpAppqEvdBug.do()
      .select(tryber.ref("id").withSchema("wp_appq_evd_profile"))
      .countDistinct({ counter: "wp_appq_evd_campaign.id" })
      .join(
        "wp_appq_evd_profile",
        "wp_appq_evd_bug.wp_user_id",
        "wp_appq_evd_profile.wp_user_id"
      )
      .join(
        "wp_crowd_appq_has_candidate",
        "wp_crowd_appq_has_candidate.user_id",
        "wp_appq_evd_profile.wp_user_id"
      )
      .join(
        "wp_appq_evd_campaign",
        "wp_appq_evd_campaign.id",
        "wp_appq_evd_bug.campaign_id"
      )
      .where("wp_appq_evd_campaign.is_business", 1)
      .where("subscription_date", ">=", last30Days.toISOString())
      .whereIn("wp_appq_evd_profile.id", this.candidateIds)
      .groupBy("wp_appq_evd_profile.id");
  }

  getCandidateData(candidate: { id: number }) {
    const allTimeCps = this.allTimeCps.find(
      (candidateData) => candidateData.id === candidate.id
    );
    const lastMonthCps = this.lastMonthCps.find(
      (candidateData) => candidateData.id === candidate.id
    );
    return {
      businessCps: allTimeCps ? allTimeCps.counter : 0,
      businessCpsLastMonth: lastMonthCps ? lastMonthCps.counter : 0,
    };
  }
}

export { CandidateBusinessCampaigns };
