import { tryber } from "@src/features/database";

class CandidateBusinessCampaigns {
  private candidateIds: number[];

  public candidateData:
    | {
        id: number;
        businessCps: number;
        businessCpsLastMonth: number;
      }[] = [];

  constructor({ candidateIds }: { candidateIds: number[] }) {
    this.candidateIds = candidateIds;
  }
  async init() {
    const data = await tryber.tables.WpAppqEvdBug.do()
      .select(tryber.ref("id").withSchema("wp_appq_evd_profile"))
      .select(
        tryber.ref("id").withSchema("wp_appq_evd_campaign").as("campaign_id")
      )
      .select("subscription_date")
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
      .join("wp_crowd_appq_has_candidate", function () {
        this.on(
          "wp_crowd_appq_has_candidate.user_id",
          "=",
          "wp_appq_evd_profile.wp_user_id"
        ).andOn(
          "wp_appq_evd_campaign.id",
          "=",
          "wp_crowd_appq_has_candidate.campaign_id"
        );
      })
      .where("wp_appq_evd_campaign.is_business", 1)
      .whereIn("wp_appq_evd_profile.id", this.candidateIds);

    this.candidateData = this.candidateIds.map((candidate) => {
      const candidateData = data.filter((d) => d.id === candidate);
      const businessCps = [...new Set(candidateData.map((d) => d.campaign_id))]
        .length;
      const businessCpsLastMonth = [
        ...new Set(
          candidateData
            .filter(
              (d) =>
                new Date(d.subscription_date) >
                new Date(new Date().setMonth(new Date().getMonth() - 1))
            )
            .map((d) => d.campaign_id)
        ),
      ].length;

      return {
        id: candidate,
        businessCps,
        businessCpsLastMonth,
      };
    });
  }

  getCandidateData(candidate: { id: number }) {
    const data = this.candidateData.find(
      (candidateData) => candidateData.id === candidate.id
    );
    return {
      businessCps: data?.businessCps || 0,
      businessCpsLastMonth: data?.businessCpsLastMonth || 0,
    };
  }
}

export { CandidateBusinessCampaigns };
