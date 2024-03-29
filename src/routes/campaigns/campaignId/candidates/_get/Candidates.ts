import { tryber } from "@src/features/database";

class Candidates {
  private campaign_id: number;
  constructor({ campaign_id }: { campaign_id: number }) {
    this.campaign_id = campaign_id;
  }

  async get() {
    return await tryber.tables.WpCrowdAppqHasCandidate.do()
      .join(
        "wp_appq_evd_profile",
        "wp_crowd_appq_has_candidate.user_id",
        "wp_appq_evd_profile.wp_user_id"
      )
      .leftJoin(
        "wp_appq_activity_level",
        "wp_appq_activity_level.tester_id",
        "wp_appq_evd_profile.id"
      )
      .select(
        tryber.ref("id").withSchema("wp_appq_evd_profile"),
        "name",
        "surname"
      )
      .where("campaign_id", this.campaign_id)
      .where("accepted", 0)
      .where("name", "<>", "Deleted User")
      .orderBy("wp_appq_activity_level.level_id", "desc")
      .orderBy("wp_appq_evd_profile.id", "desc");
  }
}

export { Candidates };
