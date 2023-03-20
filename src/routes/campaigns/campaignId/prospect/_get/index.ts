/** OPENAPI-CLASS: get-campaigns-campaign-prospect */
import CampaignRoute from "@src/features/routes/CampaignRoute";
import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";
import { bool } from "aws-sdk/clients/signer";
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
    const testersbugsCounters = await this.getBugCounters(
      testers.map((t) => t.id)
    );
    const testersTasksCounters = await this.getUsecasesCounters(
      testers.map((t) => t.id)
    );
    const testersExistingData = await this.getActualProspectData(
      testers.map((t) => t.id)
    );

    return testers.map((tester) => {
      const currentTesterBugs = testersbugsCounters.filter(
        (t) => t.testerId === tester.id
      )[0];
      const currentTesterTasks = testersTasksCounters.filter(
        (t) => t.testerId === tester.id
      )[0];
      const testerExistingData = testersExistingData.filter(
        (t) => t.tester_id === tester.id
      )[0];

      return {
        tester: {
          id: tester.id,
          name: tester.name,
          surname: tester.surname,
        },
        bugs: {
          critical: currentTesterBugs.critical,
          high: currentTesterBugs.high,
          medium: currentTesterBugs.medium,
          low: currentTesterBugs.low,
        },
        usecases: {
          completed: currentTesterTasks.completed,
          required: currentTesterTasks.required,
        },
        payout: {
          // se non ho righe nel prospect calcolo da cpmeta se la regola passa altrimeni è 0
          completion:
            testerExistingData && testerExistingData.complete_eur
              ? testerExistingData.complete_eur
              : 0,
          // se non ho riga nel prospect calcolo da cpmeta
          bug:
            testerExistingData && testerExistingData.bonus_bug_eur
              ? testerExistingData.bonus_bug_eur
              : 0,
          // se non ho riga nel prospect è 0
          refund:
            testerExistingData && testerExistingData.refund
              ? testerExistingData.refund
              : 0,
          // se non ho riga nel prospect è 0
          extra:
            testerExistingData && testerExistingData.extra_eur
              ? testerExistingData.extra_eur
              : 0,
        },
        experience: {
          // se non ho righe nel prospect calcolo da complete_pts se la regola passa altrimeni è -2 * complete_pts
          completion:
            testerExistingData && testerExistingData.complete_pts
              ? testerExistingData.complete_pts
              : 0,
          extra:
            testerExistingData && testerExistingData.extra_pts
              ? testerExistingData.extra_pts
              : 0,
        },
        note:
          testerExistingData && testerExistingData.notes
            ? testerExistingData.notes
            : "",
        status: "pending" as const,
      };
    });
  }

  private async getActualProspectData(testerids: number[]) {
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
        "notes",
        "is_edit",
        "is_completed"
      )
      .where({ campaign_id: this.cp_id })
      .whereIn("tester_id", testerids);
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
      .where("accepted", 1);
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
        .where("wp_appq_evd_profile.id", testerId)
        //we expect that uploaded bugs have just status 2 = approved
        .where("wp_appq_evd_bug.status_id", 2)
        .groupBy("wp_appq_evd_bug.severity_id");
      if (approvedBugs.length === 0) {
        bugCountersAndTesterId.push({
          testerId: testerId,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
        });
      } else {
        let critical = 0;
        if (
          approvedBugs.filter((b) => b.severity_id === 4).length &&
          typeof approvedBugs.filter((b) => b.severity_id === 4)[0].count !==
            "undefined"
        )
          critical = Number(
            approvedBugs.filter((b) => b.severity_id === 4)[0].count
          );
        let high = 0;
        if (
          approvedBugs.filter((b) => b.severity_id === 3).length &&
          typeof approvedBugs.filter((b) => b.severity_id === 3)[0].count !==
            "undefined"
        )
          high = Number(
            approvedBugs.filter((b) => b.severity_id === 3)[0].count
          );
        let medium = 0;
        if (
          approvedBugs.filter((b) => b.severity_id === 2).length &&
          typeof approvedBugs.filter((b) => b.severity_id === 2)[0].count !==
            "undefined"
        )
          medium = Number(
            approvedBugs.filter((b) => b.severity_id === 2)[0].count
          );
        let low = 0;
        if (
          approvedBugs.filter((b) => b.severity_id === 1).length &&
          typeof approvedBugs.filter((b) => b.severity_id === 1)[0].count !==
            "undefined"
        )
          low = Number(
            approvedBugs.filter((b) => b.severity_id === 1)[0].count
          );
        bugCountersAndTesterId.push({
          testerId: testerId,
          critical: critical,
          high: high,
          medium: medium,
          low: low,
        });
      }
    }
    return bugCountersAndTesterId;
  }

  private async getUsecasesCounters(testerIds: number[]) {
    const usecasesCountersAndTesterId: {
      testerId: number;
      completed: number;
      required: number;
    }[] = [];
    const campaignUsecases = await tryber.tables.WpAppqCampaignTask.do()
      .select(
        tryber.ref("id").withSchema("wp_appq_campaign_task"),
        tryber.ref("is_required").withSchema("wp_appq_campaign_task")
      )
      .where({ campaign_id: this.cp_id });
    const required = campaignUsecases.filter((u) => u.is_required === 1).length;

    for (const testerId of testerIds) {
      const completed = await tryber.tables.WpAppqUserTask.do()
        .count({ count: "wp_appq_user_task.id" })
        .join(
          "wp_appq_campaign_task",
          "wp_appq_campaign_task.id",
          "wp_appq_user_task.task_id"
        )
        .where({ campaign_id: this.cp_id })
        .where({ tester_id: testerId })
        .where({ is_completed: 1 });
      usecasesCountersAndTesterId.push({
        testerId: testerId,
        completed:
          typeof completed[0].count === "number" ? completed[0].count : 0,
        required: required,
      });
    }
    return usecasesCountersAndTesterId;
  }

  private async isCompletionRulePassed(testerId: number): Promise<boolean> {
    let is_completed = (
      await tryber.tables.WpAppqProspectPayout.do()
        .select("is_completed")
        .where({ campaign_id: this.cp_id })
        .where({ tester_id: testerId })
    )[0].is_completed;
    /* default completion rule: se non ci sono righe nel prospect
      - % usecase completati è > di % usecases (meta) e
      - ci sono bug approvati >= minum bug 

      altrimenti è il valore di is_completed del prospect
      */
    const usecases = await tryber.tables.WpAppqUserTask.do()
      .select(tryber.ref("id").withSchema("wp_appq_user_task"), "is_completed")
      .join(
        "wp_appq_campaign_task",
        "wp_appq_campaign_task.id",
        "wp_appq_user_task.task_id"
      )
      .where({ campaign_id: this.cp_id })
      .where({ tester_id: testerId });
    const percentCompletedUsecases =
      usecases.filter((u) => u.is_completed === 1).length / usecases.length;

    return !!is_completed;
  }
}
