/** OPENAPI-CLASS: get-campaigns-campaign-prospect */
import CampaignRoute from "@src/features/routes/CampaignRoute";
import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";
export default class ProspectRoute extends CampaignRoute<{
  response: StoplightOperations["get-campaigns-campaign-prospect"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-campaigns-campaign-prospect"]["parameters"]["path"];
}> {
  protected async filter(): Promise<boolean> {
    if (!(await super.filter())) return false;
    if (
      !(await this.hasAccessTesterSelection(this.cp_id)) ||
      !(await this.hasAccessToProspect(this.cp_id))
    ) {
      this.setError(403, new OpenapiError("Access denied"));

      return false;
    }
    if (await this.testerPayoutsWereEdit()) {
      this.setError(412, new OpenapiError("Precondition failed"));

      return false;
    }
    return true;
  }

  protected async prepare(): Promise<void> {
    let prospect;
    try {
      prospect = { items: await this.getProspectItems() };
    } catch (e: any) {
      return this.setError(
        500,
        new OpenapiError(
          e.message || "There was an error while fetching prospect"
        )
      );
    }

    if (!prospect || !prospect.items.length)
      return this.setSuccess(200, { items: [] });

    return this.setSuccess(200, prospect);
  }

  private async testerPayoutsWereEdit() {
    const payoutsModified = await tryber.tables.WpAppqProspectPayout.do()
      .select("id")
      .where({ campaign_id: this.cp_id })
      .where("is_edit", ">", 0);
    return payoutsModified.length > 0;
  }

  private async getProspectItems() {
    const testers = await this.getTesterInCampaign();
    const bugCounters = await this.getBugCounters(testers.map((t) => t.id));
    return testers.map((tester) => {
      const currentBugCounters = bugCounters.filter(
        (t) => t.testerId === tester.id
      )[0];
      return {
        tester: {
          id: tester.id,
          name: tester.name,
          surname: tester.surname,
        },
        bugs: {
          clitical: currentBugCounters.critical,
          high: currentBugCounters.high,
          medium: currentBugCounters.medium,
          low: currentBugCounters.low,
        },
      };
    });
  }

  private async getTesterInCampaign() {
    const acceptedTesters = await tryber.tables.WpCrowdAppqHasCandidate.do()
      .select(
        tryber.ref("id").withSchema("wp_appq_evd_profile"),
        tryber.ref("name").withSchema("wp_appq_evd_profile"),
        tryber.ref("surname").withSchema("wp_appq_evd_profile")
      )
      .join(
        "wp_appq_evd_profile",
        "wp_appq_evd_profile.wp_user_id",
        "wp_crowd_appq_has_candidate.user_id"
      )
      .where({ campaign_id: this.cp_id })
      .where("accepted", "=", 1);
    return acceptedTesters;
  }

  private async getBugCounters(testerIds: number[]) {
    const bugCountersAndTesterId: {
      testerId: number;
      critical: number;
      high: number;
      medium: number;
      low: number;
    }[] = [];
    for (const testerId of testerIds) {
      const approvedBugs = await tryber.tables.WpAppqEvdBug.do()
        .count({ count: "wp_appq_evd_profile.id" })
        .select(tryber.ref("severity_id").withSchema("wp_appq_evd_bug"))
        .join(
          "wp_appq_evd_profile",
          "wp_appq_evd_profile.wp_user_id",
          "wp_appq_evd_bug.wp_user_id"
        )
        .where({ campaign_id: this.cp_id })
        .where("wp_appq_evd_profile.id", "=", testerId)
        //we expect that uploaded bugs have just status 2 = approved
        .where("wp_appq_evd_bug.status_id", "=", 2)
        .groupBy("wp_appq_evd_bug.severity_id");
      console.log(approvedBugs);
      if (approvedBugs.length === 0) {
        bugCountersAndTesterId.push({
          testerId: testerId,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
        });
      } else {
        const hasCritical = approvedBugs.filter((b) => b.severity_id === 4)
          .length
          ? true
          : false;
        const hasHigh = approvedBugs.filter((b) => b.severity_id === 3).length
          ? true
          : false;
        const hasmedium = approvedBugs.filter((b) => b.severity_id === 2).length
          ? true
          : false;
        const hasLow = approvedBugs.filter((b) => b.severity_id === 1).length
          ? true
          : false;
        bugCountersAndTesterId.push({
          testerId: testerId,
          critical: hasCritical
            ? approvedBugs.filter((b) => b.severity_id === 4)[0].count
            : 0,
          high: hasHigh
            ? approvedBugs.filter((b) => b.severity_id === 3)[0].count
            : 0,
          medium: hasmedium
            ? approvedBugs.filter((b) => b.severity_id === 2)[0].count
            : 0,
          low: hasLow
            ? approvedBugs.filter((b) => b.severity_id === 1)[0].count
            : 0,
        });
      }
    }
    return bugCountersAndTesterId;
  }
}
