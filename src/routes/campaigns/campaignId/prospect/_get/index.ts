/** OPENAPI-CLASS: get-campaigns-campaign-prospect */
import CampaignRoute from "@src/features/routes/CampaignRoute";
import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";
export default class ProspectRoute extends CampaignRoute<{
  response: StoplightOperations["get-campaigns-campaign-prospect"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-campaigns-campaign-prospect"]["parameters"]["path"];
}> {
  private testers: {
    id: number;
    name: string;
    surname: string;
    group: number;
    bugs: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    usecases: {
      completed: number;
      required: number;
    };
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
    bugsExperience: {
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
    bugsExperience: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    },
    completion: { payout: 0, experience: 0 },
    minimumBugs: 0,
    percentUsecases: 0,
  };
  private paidTesters: number[] = [];

  protected async init(): Promise<void> {
    await super.init();
    this.testers = await this.getTestersData();
    this.currentProspect = await this.getActualProspectData();
    this.payoutConfig = await this.getPayoutConfig();
    this.paidTesters = await this.getPaidTesters();
  }

  private async getTestersData() {
    const testers = await this.getSelectedTesters();
    const bugsByTesters = await this.getBugsByTesters(testers);
    const usecasesByTesters = await this.getUsecasesByTesters(testers);
    return testers.map((t) => {
      const bugs = bugsByTesters.find((b) => b.testerId === t.id);
      const usecases = usecasesByTesters.find((b) => b.testerId === t.id);
      return {
        ...t,
        bugs: {
          critical: bugs ? bugs.critical : 0,
          high: bugs ? bugs.high : 0,
          medium: bugs ? bugs.medium : 0,
          low: bugs ? bugs.low : 0,
        },
        usecases: {
          required: usecases ? usecases.required : 0,
          completed: usecases ? usecases.completed : 0,
        },
      };
    });
  }

  private async getSelectedTesters() {
    return await tryber.tables.WpCrowdAppqHasCandidate.do()
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
      .where("name", "!=", "Deleted User")
      .where("accepted", 1)
      .orderBy("wp_appq_evd_profile.id", "ASC");
  }

  private async getBugsByTesters(testers: { id: number }[]) {
    const testerIds = testers.map((t) => t.id);
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
      .where("wp_appq_evd_profile.id", "IN", testerIds)
      .where("wp_appq_evd_bug.status_id", 2)
      .groupBy("wp_appq_evd_bug.severity_id", "wp_appq_evd_profile.id");

    const result = testerIds.map((tid) => ({
      testerId: tid,
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
    const testerids = this.testers.map((t) => t.id);
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

  private async getUsecasesByTesters(testers: { id: number; group: number }[]) {
    const requiredCampaignUsecases = await tryber.tables.WpAppqCampaignTask.do()
      .select("id")
      .where({ campaign_id: this.cp_id })
      .where({ is_required: 1 });

    const groupCounts = await tryber.tables.WpAppqCampaignTaskGroup.do()
      .count({ count: "task_id" })
      .select("group_id")
      .where(
        "task_id",
        "IN",
        requiredCampaignUsecases.map((u) => u.id)
      )
      .groupBy("group_id");

    const completedRequiredUsecases = await tryber.tables.WpAppqUserTask.do()
      .count({ count: "wp_appq_user_task.id" })
      .select("tester_id")
      .select("group_id")
      .join(
        "wp_appq_campaign_task_group",
        "wp_appq_campaign_task_group.task_id",
        "wp_appq_user_task.task_id"
      )
      .where(
        "tester_id",
        "IN",
        testers.map((t) => t.id)
      )
      .where("is_completed", 1)
      .where(
        "wp_appq_user_task.task_id",
        "IN",
        requiredCampaignUsecases.map((u) => u.id)
      )
      .groupBy("tester_id", "group_id");
    return testers.map((t) => {
      const completed = completedRequiredUsecases.filter(
        (uc) => uc.tester_id === t.id
      );
      const completedUsecaseGroupAll =
        completed.find((uc) => uc.group_id === 0)?.count || 0;
      const completedUsecaseGroupTester =
        completed.find((uc) => uc.group_id === t.group)?.count || 0;
      const usecasesGroupAll =
        (groupCounts.find((uc) => uc.group_id === 0)?.count as number) || 0;
      const usecasesGroupTester =
        (groupCounts.find((uc) => uc.group_id === t.group)?.count as number) ||
        0;
      return {
        testerId: t.id,
        completed: completedUsecaseGroupAll + completedUsecaseGroupTester,
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
        "point_multiplier_critical",
        "point_multiplier_high",
        "point_multiplier_medium",
        "point_multiplier_low",
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

    this.payoutConfig.bugsExperience.low = parseFloat(
      meta.find((m) => m.meta_key === "point_multiplier_low")?.meta_value || "0"
    );
    this.payoutConfig.bugsExperience.medium = parseFloat(
      meta.find((m) => m.meta_key === "point_multiplier_medium")?.meta_value ||
        "0"
    );
    this.payoutConfig.bugsExperience.high = parseFloat(
      meta.find((m) => m.meta_key === "point_multiplier_high")?.meta_value ||
        "0"
    );
    this.payoutConfig.bugsExperience.critical = parseFloat(
      meta.find((m) => m.meta_key === "point_multiplier_critical")
        ?.meta_value || "0"
    );

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select("campaign_pts")
      .where("id", this.cp_id)
      .first();
    if (campaign) {
      this.payoutConfig.completion.experience = campaign.campaign_pts;
    }

    return this.payoutConfig;
  }

  private async getPaidTesters() {
    const testers = await tryber.tables.WpAppqExpPoints.do()
      .select("tester_id")
      .where("campaign_id", this.cp_id)
      .where("activity_id", 1);
    return testers.map((t) => t.tester_id);
  }

  protected async filter(): Promise<boolean> {
    if (!(await super.filter())) return false;

    if (!this.hasAccessTesterSelection(this.cp_id)) {
      this.setError(403, new OpenapiError("Access denied"));
      return false;
    }

    if (!this.testers.length) {
      this.setError(404, new OpenapiError("There are no testers selected"));
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
    const items = this.testers.map((tester) => ({
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
      weightedBugs: this.getWeightedBugs(tester.id),
      isCompleted: this.getCompletion(tester.id),
      isTopTester: false,
    }));
    const topTester = this.getTopTester(items);
    topTester.isTopTester = true;

    return this.setSuccess(200, {
      items,
    });
  }

  private getTopTester(
    items: StoplightOperations["get-campaigns-campaign-prospect"]["responses"]["200"]["content"]["application/json"]["items"]
  ) {
    return items.reduce((prev, current) => {
      if (prev.weightedBugs < current.weightedBugs) return current;
      if (prev.weightedBugs === current.weightedBugs) {
        if (prev.bugs.critical < current.bugs.critical) return current;
        if (prev.bugs.critical === current.bugs.critical) {
          if (prev.bugs.high < current.bugs.high) return current;
          if (prev.bugs.high === current.bugs.high) {
            if (prev.bugs.medium < current.bugs.medium) return current;
            if (prev.bugs.medium === current.bugs.medium) {
              if (prev.bugs.low < current.bugs.low) return current;
            }
          }
        }
      }
      return prev;
    });
  }

  private getTesterBugs(tid: number) {
    const result = this.testers.find((t) => t.id === tid);
    if (!result) return { critical: 0, high: 0, medium: 0, low: 0 };
    return {
      critical: result.bugs.critical,
      high: result.bugs.high,
      medium: result.bugs.medium,
      low: result.bugs.low,
    };
  }

  private getWeightedBugs(tid: number) {
    const bugs = this.getTesterBugs(tid);
    return (
      bugs.critical * this.payoutConfig.bugsExperience.critical +
      bugs.high * this.payoutConfig.bugsExperience.high +
      bugs.medium * this.payoutConfig.bugsExperience.medium +
      bugs.low * this.payoutConfig.bugsExperience.low
    );
  }

  private getCompletion(tid: number) {
    const result = this.currentProspect.find((t) => t.tester_id === tid);
    if (!result) return this.defaultTesterCompletion(tid);
    return result.is_completed === 1;
  }

  private getTesterUsecases(tid: number) {
    const result = this.testers.find((t) => t.id === tid);
    if (!result) return { completed: 0, required: 0 };
    return {
      completed: result.usecases.completed,
      required: result.usecases.required,
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
    return {
      completion: this.defaultTesterCompletion(tid)
        ? this.payoutConfig.completion.payout
        : 0,
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
        usecases.completed / usecases.required >=
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
    if (!result) return this.defaultTesterExperience(tid);
    return {
      completion: result.complete_pts,
      extra: result.extra_pts,
    };
  }

  private defaultTesterExperience(tid: number) {
    return {
      completion: this.defaultTesterCompletion(tid)
        ? this.payoutConfig.completion.experience
        : -2 * this.payoutConfig.completion.experience,
      extra: 0,
    };
  }

  private getTesterNotes(tid: number) {
    const result = this.currentProspect.find((t) => t.tester_id === tid);
    if (!result) return this.defaultTesterNote(tid);
    return result.notes;
  }

  private defaultTesterNote(tid: number) {
    return this.defaultTesterCompletion(tid)
      ? "Ottimo lavoro!"
      : `Purtroppo non hai completato l’attività, ricevi quindi ${
          -this.payoutConfig.completion.experience * 2
        } punti esperienza`;
  }

  private getTesterStatus(tid: number) {
    const result = this.paidTesters.find((t) => t === tid);
    if (!result) return "pending" as const;
    return "done" as const;
  }
}
