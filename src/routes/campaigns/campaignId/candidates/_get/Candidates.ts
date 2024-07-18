import { tryber } from "@src/features/database";

class Candidates {
  private campaign_id: number;
  private show:
    | "onlyAccepted"
    | "onlyCandidates"
    | "all"
    | "candidatesAndExcluded" = "all";
  constructor({
    campaign_id,
    show,
  }: {
    campaign_id: number;
    show: "onlyAccepted" | "onlyCandidates" | "all" | "candidatesAndExcluded";
  }) {
    this.campaign_id = campaign_id;
    this.show = show;
  }

  async get() {
    const query = tryber.tables.WpCrowdAppqHasCandidate.do()
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
      .where("name", "<>", "Deleted User")
      .orderBy("wp_appq_activity_level.level_id", "desc")
      .orderBy("wp_appq_evd_profile.id", "desc");

    if (this.show === "onlyAccepted") {
      query.where("accepted", 1);
    } else if (this.show === "onlyCandidates") {
      query.where("accepted", 0);
    } else if (this.show === "candidatesAndExcluded") {
      query.whereIn("accepted", [0, -1]);
    }

    console.log(query.toString());

    return await query;
  }
}

export { Candidates };
