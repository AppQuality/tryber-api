/** OPENAPI-CLASS: get-campaigns-campaign-prospect */
import CampaignRoute from "@src/features/routes/CampaignRoute";
import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";
export default class ProspectRoute extends CampaignRoute<{
  response: StoplightOperations["get-campaigns-campaign-prospect"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-campaigns-campaign-prospect"]["parameters"]["path"];
}> {
  private selectedTesters: {
    id: number;
    name: string;
    surname: string;
    group: number;
  }[] = [];
  private testerBugCounters: {
    testerId: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  }[] = [];
  private testerUsecaseCounters: {
    testerId: number;
    completed: number;
    required: number;
  }[] = [];
  private currentProspect: {
    id: number;
    tester_id: number;
    is_completed: number;
    complete_pts: number;
    extra_pts: number;
    complete_eur: number;
    bonus_bug_eur: number;
    extra_eur: number;
    refund: number;
    notes: string;
  }[] = [];
  private payoutConfig: {
    bugs: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    completion: { payout: number; experience: number };
    minimumBugs: number;
    percentUsecases: number;
  } = {
    bugs: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    },
    completion: { payout: 0, experience: 0 },
    minimumBugs: 0,
    percentUsecases: 0,
  };

  protected async init(): Promise<void> {
    await super.init();
    this.selectedTesters = await this.getSelectedTesters();
    this.testerBugCounters = await this.getBugCounters();
    this.testerUsecaseCounters = await this.getUsecasesCounters();
    this.currentProspect = await this.getActualProspectData();
    this.payoutConfig = await this.getPayoutConfig();
  }

  private async getSelectedTesters() {
    const acceptedTesters = await tryber.tables.WpCrowdAppqHasCandidate.do()
      .select(
        tryber.ref("id").withSchema("wp_appq_evd_profile"),
        tryber.ref("name").withSchema("wp_appq_evd_profile"),
        tryber.ref("surname").withSchema("wp_appq_evd_profile"),
        tryber
          .ref("group_id")
          .as("group")
          .withSchema("wp_crowd_appq_has_candidate")
      )
      .join(
        "wp_appq_evd_profile",
        "wp_appq_evd_profile.wp_user_id",
        "wp_crowd_appq_has_candidate.user_id"
      )
      .where({ campaign_id: this.cp_id })
      .where("accepted", 1);
    return acceptedTesters;
  }

  private async getBugCounters() {
    const approvedBugList = await tryber.tables.WpAppqEvdBug.do()
      .count({ count: "wp_appq_evd_profile.id" })
      .select(tryber.ref("severity_id").withSchema("wp_appq_evd_bug"))
      .select(tryber.ref("id").as("testerId").withSchema("wp_appq_evd_profile"))
      .join(
        "wp_appq_evd_profile",
        "wp_appq_evd_profile.wp_user_id",
        "wp_appq_evd_bug.wp_user_id"
      )
      .where({ campaign_id: this.cp_id })
      .where(
        "wp_appq_evd_profile.id",
        "IN",
        this.selectedTesters.map((t) => t.id)
      )
      .where("wp_appq_evd_bug.status_id", 2)
      .groupBy("wp_appq_evd_bug.severity_id", "wp_appq_evd_profile.id");

    const result = this.selectedTesters.map((t) => ({
      testerId: t.id,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    }));
    for (const item of approvedBugList) {
      const tester = result.find((t) => t.testerId === item.testerId);
      if (tester) {
        switch (item.severity_id) {
          case 1:
            tester.low = item.count as number;
            break;
          case 2:
            tester.medium = item.count as number;
            break;
          case 3:
            tester.high = item.count as number;
            break;
          case 4:
            tester.critical = item.count as number;
            break;
        }
      }
    }
    return result;
  }

  private async getActualProspectData() {
    const testerids = this.selectedTesters.map((t) => t.id);
    return await tryber.tables.WpAppqProspectPayout.do()
      .select(
        tryber.ref("id").withSchema("wp_appq_prospect_payout"),
        "tester_id",
        "is_completed",
        "complete_pts",
        "extra_pts",
        "complete_eur",
        "bonus_bug_eur",
        "extra_eur",
        "refund",
        "notes"
      )
      .where({ campaign_id: this.cp_id })
      .whereIn("tester_id", testerids);
  }

  private async getUsecasesCounters() {
    const requiredCampaignUsecases = await tryber.tables.WpAppqCampaignTask.do()
      .count({ count: "wp_appq_campaign_task.id" })
      .select(tryber.ref("group_id").withSchema("wp_appq_campaign_task_group"))
      .join(
        "wp_appq_campaign_task_group",
        "wp_appq_campaign_task_group.task_id",
        "wp_appq_campaign_task.id"
      )
      .where({ campaign_id: this.cp_id })
      .where({ is_required: 1 })
      .groupBy("wp_appq_campaign_task_group.group_id");

    const completedRequiredUsecases = await tryber.tables.WpAppqUserTask.do()
      .count({ count: "wp_appq_user_task.id" })
      .select(tryber.ref("tester_id").withSchema("wp_appq_user_task"))
      .join(
        "wp_appq_campaign_task",
        "wp_appq_campaign_task.id",
        "wp_appq_user_task.task_id"
      )
      .where("campaign_id", this.cp_id)
      .where(
        "tester_id",
        "IN",
        this.selectedTesters.map((t) => t.id)
      )
      .where("is_completed", 1)
      .where("is_required", 1)
      .groupBy("tester_id");

    return this.selectedTesters.map((t) => {
      const completed = completedRequiredUsecases.find(
        (uc) => uc.tester_id === t.id
      );
      const usecasesGroupAll =
        requiredCampaignUsecases.filter((uc) => uc.group_id === 0).length || 0;
      const usecasesGroupTester =
        requiredCampaignUsecases.filter((uc) => uc.group_id === t.group)
          .length || 0;
      return {
        testerId: t.id,
        completed: completed ? (completed.count as number) : 0,
        required: usecasesGroupAll + usecasesGroupTester,
      };
    });
  }

  private async getPayoutConfig() {
    const meta = await tryber.tables.WpAppqCpMeta.do()
      .select("meta_key", "meta_value")
      .where({ campaign_id: this.cp_id })
      .where("meta_key", "IN", [
        "critical_bug_payout",
        "high_bug_payout",
        "medium_bug_payout",
        "low_bug_payout",
        "campaign_complete_bonus_eur",
        "minimum_bugs",
        "percent_usecases",
      ]);

    this.payoutConfig.bugs.critical = parseFloat(
      meta.find((m) => m.meta_key === "critical_bug_payout")?.meta_value || "0"
    );
    this.payoutConfig.bugs.high = parseFloat(
      meta.find((m) => m.meta_key === "high_bug_payout")?.meta_value || "0"
    );
    this.payoutConfig.bugs.medium = parseFloat(
      meta.find((m) => m.meta_key === "medium_bug_payout")?.meta_value || "0"
    );
    this.payoutConfig.bugs.low = parseFloat(
      meta.find((m) => m.meta_key === "low_bug_payout")?.meta_value || "0"
    );
    this.payoutConfig.completion.payout = parseFloat(
      meta.find((m) => m.meta_key === "campaign_complete_bonus_eur")
        ?.meta_value || "0"
    );
    this.payoutConfig.minimumBugs = parseFloat(
      meta.find((m) => m.meta_key === "minimum_bugs")?.meta_value || "0"
    );
    this.payoutConfig.percentUsecases =
      parseFloat(
        meta.find((m) => m.meta_key === "percent_usecases")?.meta_value || "0"
      ) / 100;
    return this.payoutConfig;
  }

  protected async filter(): Promise<boolean> {
    if (!(await super.filter())) return false;
    if (
      !this.hasAccessTesterSelection(this.cp_id) ||
      !this.hasAccessToProspect(this.cp_id)
    ) {
      this.setError(403, new OpenapiError("Access denied"));

      return false;
    }
    if (await this.thereIsAnEditOnOldProspect()) {
      this.setError(412, new OpenapiError("You can't edit an old prospect"));
      return false;
    }
    return true;
  }

  private async thereIsAnEditOnOldProspect() {
    const payoutsModified = await tryber.tables.WpAppqProspectPayout.do()
      .select("id")
      .where({ campaign_id: this.cp_id })
      .where("is_edit", ">", 0);
    return payoutsModified.length > 0;
  }

  protected async prepare(): Promise<void> {
    return this.setSuccess(200, {
      items: this.selectedTesters.map((tester) => {
        return {
          tester: {
            id: tester.id,
            name: tester.name,
            surname: tester.surname,
          },
          bugs: this.getTesterBugs(tester.id),
          usecases: this.getTesterUsecases(tester.id),
          payout: this.getTesterPayout(tester.id),
          experience: this.getTesterExperience(tester.id),
          note: this.getTesterNotes(tester.id),
          status: this.getTesterStatus(tester.id),
        };
      }),
    });
  }

  private getTesterBugs(tid: number) {
    const result = this.testerBugCounters.find((t) => t.testerId === tid);
    if (!result) return { critical: 0, high: 0, medium: 0, low: 0 };
    return {
      critical: result.critical,
      high: result.high,
      medium: result.medium,
      low: result.low,
    };
  }

  private getTesterUsecases(tid: number) {
    const result = this.testerUsecaseCounters.find((t) => t.testerId === tid);
    if (!result) return { completed: 0, required: 0 };
    return {
      completed: result.completed,
      required: result.required,
    };
  }

  private getTesterPayout(tid: number) {
    const result = this.currentProspect.find((t) => t.tester_id === tid);
    if (!result) return this.defaultTesterPayout(tid);
    return {
      completion: result.complete_eur,
      bug: result.bonus_bug_eur,
      refund: result.refund,
      extra: result.extra_eur,
    };
  }

  private defaultTesterPayout(tid: number) {
    let completion = 0;
    if (this.defaultTesterCompletion(tid)) {
      completion = this.payoutConfig.completion.payout;
    }
    return {
      completion: completion,
      bug: this.defaultBugPayout(tid),
      refund: 0,
      extra: 0,
    };
  }

  private defaultTesterCompletion(tid: number) {
    const usecases = this.getTesterUsecases(tid);
    const bugs = this.getTesterBugs(tid);
    const totalBugs = Object.keys(bugs).reduce(
      (acc, key) => acc + bugs[key as keyof typeof bugs],
      0
    );
    return (
      (usecases.required === 0 ||
        usecases.completed / usecases.required >
          this.payoutConfig.percentUsecases) &&
      totalBugs >= this.payoutConfig.minimumBugs
    );
  }

  private defaultBugPayout(tid: number) {
    const bugs = this.getTesterBugs(tid);
    return Object.keys(bugs).reduce((acc, key) => {
      const value = bugs[key as keyof typeof bugs];
      switch (key) {
        case "critical":
          return acc + value * this.payoutConfig.bugs.critical;
        case "high":
          return acc + value * this.payoutConfig.bugs.high;
        case "medium":
          return acc + value * this.payoutConfig.bugs.medium;
        case "low":
          return acc + value * this.payoutConfig.bugs.low;
        default:
          return acc;
      }
    }, 0);
  }

  private getTesterExperience(tid: number) {
    const result = this.currentProspect.find((t) => t.tester_id === tid);
    if (!result) return this.defaultTesterExperience();
    return {
      completion: result.complete_pts,
      extra: result.extra_pts,
    };
  }

  private defaultTesterExperience() {
    return { completion: 0, extra: 0 };
  }

  private getTesterNotes(tid: number) {
    const result = this.currentProspect.find((t) => t.tester_id === tid);
    if (!result) return this.defaultTesterNote();
    return result.notes;
  }

  private defaultTesterNote() {
    return "";
  }

  private getTesterStatus(tid: number) {
    const result = this.currentProspect.find((t) => t.tester_id === tid);
    if (!result) return "pending" as const;
    return "pending" as const;
  }
}