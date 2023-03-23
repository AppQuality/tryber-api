/** OPENAPI-CLASS: patch-campaigns-campaign-prospect */
import CampaignRoute from "@src/features/routes/CampaignRoute";
import { tryber } from "@src/features/database";
import { sendTemplate } from "@src/features/mail/sendTemplate";
import OpenapiError from "@src/features/OpenapiError";
export default class ProspectRoute extends CampaignRoute<{
  response: StoplightOperations["patch-campaigns-campaign-prospect"]["responses"]["200"];
  parameters: StoplightOperations["patch-campaigns-campaign-prospect"]["parameters"]["path"];
  body: StoplightOperations["patch-campaigns-campaign-prospect"]["requestBody"]["content"]["application/json"];
}> {
  private COMPLETION_WORKTYPE = 1;
  private REFUND_WORKTYPE = 3;
  private worktypes: Record<number, string> = {};
  private COMPLETION_ACTIVITY_ID = 1;
  private PERFECT_BUGS_ACTIVITY_ID = 4;
  private campaignTitle: string = "";
  private perfectBugsMultiplier = 0.25;
  private completionCampaignPoints = 0;
  private testerPerfectCampaign: number[] = [];

  protected async init(): Promise<void> {
    await super.init();
    this.worktypes = await this.getWorktypes();
    this.campaignTitle = await this.getCampaignTitle();
    this.perfectBugsMultiplier = await this.getPerfectBugsMultiplier();
    this.completionCampaignPoints = await this.getCompletionCampaignPoints();
    this.testerPerfectCampaign = await this.getTesterWithPerfectCampaign();
  }

  get prospect() {
    const { items } = this.getBody();
    return items;
  }

  get assignmentDate() {
    return new Date().toISOString().slice(0, 19).replace("T", " ");
  }

  private async getWorktypes() {
    const worktypes = await tryber.tables.WpAppqPaymentWorkTypes.do().select();
    if (!worktypes.length) {
      return {
        1: "Tryber Test",
        3: "Refund Tryber Test",
      };
    }
    return worktypes.reduce(
      (obj, item) => ({ ...obj, [item.id]: item.work_type }),
      {}
    );
  }

  private async getCampaignTitle() {
    const cp_title = await tryber.tables.WpAppqEvdCampaign.do()
      .select(
        tryber.ref("title").withSchema("wp_appq_evd_campaign").as("title")
      )
      .where({ id: this.cp_id })
      .first();
    return cp_title?.title || this.campaignTitle;
  }

  private async getCompletionCampaignPoints() {
    const points = await tryber.tables.WpAppqEvdCampaign.do()
      .select(
        tryber
          .ref("campaign_pts")
          .withSchema("wp_appq_evd_campaign")
          .as("completion")
      )
      .where({ id: this.cp_id })
      .first();
    return points?.completion || this.completionCampaignPoints;
  }

  private async getPerfectBugsMultiplier() {
    const multiplier = await tryber.tables.WpOptions.do()
      .select(tryber.ref("option_value").withSchema("wp_options").as("perfect"))
      .where({ option_name: "options_point_multiplier_perfect_campaign" })
      .first();
    if (!multiplier) return this.perfectBugsMultiplier;
    return Number(multiplier.perfect);
  }

  private getTesterWithPerfectCampaignQuery() {
    return tryber.tables.WpAppqEvdProfile.do()
      .select(tryber.ref("id").withSchema("wp_appq_evd_profile").as("id"))
      .join(
        "wp_appq_evd_bug",
        "wp_appq_evd_profile.wp_user_id",
        "wp_appq_evd_bug.wp_user_id"
      )
      .where("wp_appq_evd_bug.campaign_id", this.cp_id)
      .where(
        "wp_appq_evd_profile.id",
        "IN",
        this.prospect.map((p) => p.tester.id)
      )
      .groupBy("wp_appq_evd_profile.id");
  }

  private async getTesterWithPerfectCampaign() {
    const bugsApproved = await this.getTesterWithPerfectCampaignQuery().where(
      "wp_appq_evd_bug.status_id",
      2
    );

    const bugsNotApproved =
      await this.getTesterWithPerfectCampaignQuery().where(
        "wp_appq_evd_bug.status_id",
        "<>",
        2
      );

    const perfects = this.prospect
      .map((p) => p.tester.id)
      .filter((p) => {
        const hasApproved = bugsApproved.find((b) => b.id === p);
        const hasNotApproved = bugsNotApproved.find((b) => b.id === p);
        return hasApproved && !hasNotApproved;
      });

    return perfects.length ? perfects : this.testerPerfectCampaign;
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
    if (await this.thereIsAnExpAttribution()) {
      this.setError(304, new OpenapiError("Prospect delivery already started"));
      return false;
    }
    return true;
  }

  private async thereIsAnExpAttribution() {
    const payoutsModified = await tryber.tables.WpAppqExpPoints.do()
      .select("id")
      .where({ campaign_id: this.cp_id })
      .where("activity_id", 1);
    return payoutsModified.length > 0;
  }

  protected async prepare(): Promise<void> {
    await this.saveProspect();

    await this.assignExpAttributions();
    await this.assignBooties();
    await this.sendMail();
    return this.setSuccess(200, {});
  }

  protected async assignExpAttributions() {
    const exp_data = [
      ...this.getExpDataForCompletion(),
      ...this.getExpDataForPerfect(),
    ];
    if (exp_data.length)
      await tryber.tables.WpAppqExpPoints.do().insert(exp_data);
  }

  private getExpDataForCompletion() {
    return this.prospect.map((prospect) => {
      const {
        tester: { id: tester_id },
        experience: { completion: completion, extra: extra },
      } = prospect;
      const status = completion > 0 ? "successfully" : "unsuccessfully"; //isComplete
      return {
        tester_id,
        campaign_id: this.cp_id,
        activity_id: this.COMPLETION_ACTIVITY_ID,
        reason: `[CP${this.cp_id}] ${this.campaignTitle} - Campaign ${status} completed`,
        creation_date: this.assignmentDate,
        pm_id: this.getTesterId(),
        amount: completion + extra,
        bug_id: -1,
      };
    });
  }

  private getExpDataForPerfect() {
    // filter tester with perfect bugs
    return this.prospect
      .filter((prospect) =>
        this.testerPerfectCampaign.includes(prospect.tester.id)
      )
      .map((prospect) => {
        const {
          tester: { id: tester_id },
        } = prospect;
        return {
          tester_id,
          campaign_id: this.cp_id,
          activity_id: this.PERFECT_BUGS_ACTIVITY_ID,
          reason: `Congratulations all your submitted bugs have been approved, here a bonus for you`,
          creation_date: this.assignmentDate,
          pm_id: this.getTesterId(),
          amount: this.completionCampaignPoints * this.perfectBugsMultiplier,
          bug_id: -1,
        };
      });
  }

  protected async assignBooties() {
    const booty_data = [
      ...this.getBootiesForCompletion(),
      ...this.getBootiesForRefund(),
    ];
    if (booty_data.length)
      await tryber.tables.WpAppqPayment.do().insert(booty_data);
  }

  private getBootiesForCompletion() {
    return this.prospect
      .filter(
        (prospect) =>
          prospect.payout.completion +
            prospect.payout.bug +
            prospect.payout.extra >
          0
      )
      .map((prospect) => {
        const {
          tester: { id: tester_id },
          payout: { completion, bug, extra },
        } = prospect;
        return {
          tester_id,
          campaign_id: this.cp_id,
          amount: completion + bug + extra,
          note: `[CP${this.cp_id}] ${this.campaignTitle}`,
          created_by: this.getTesterId(),
          work_type: this.worktypes[this.COMPLETION_WORKTYPE],
          work_type_id: this.COMPLETION_WORKTYPE,
          creation_date: this.assignmentDate,
          is_paid: 0,
          receipt_id: -1,
          is_requested: 0,
          request_id: 0,
        };
      });
  }

  private getBootiesForRefund() {
    return this.prospect
      .filter((prospect) => prospect.payout.refund > 0)
      .map((prospect) => {
        const {
          tester: { id: tester_id },
          payout: { refund },
        } = prospect;
        return {
          tester_id,
          campaign_id: this.cp_id,
          amount: refund,
          note: `[CP${this.cp_id}] ${this.campaignTitle} - Refund`,
          created_by: this.getTesterId(),
          work_type_id: this.REFUND_WORKTYPE,
          work_type: this.worktypes[this.REFUND_WORKTYPE],
          creation_date: this.assignmentDate,
          is_paid: 0,
          receipt_id: -1,
          is_requested: 0,
          request_id: 0,
        };
      });
  }

  private async saveProspect() {
    if (this.prospect.length === 0) return;

    const updates = this.prospect.map((prospect) => ({
      tester_id: prospect.tester.id,
      campaign_id: this.cp_id,
      complete_eur: prospect.payout.completion,
      bonus_bug_eur: prospect.payout.bug,
      extra_eur: prospect.payout.extra,
      refund: prospect.payout.refund,
      complete_pts: prospect.experience.completion,
      extra_pts: prospect.experience.extra,
    }));

    const payouts = await tryber.tables.WpAppqProspectPayout.do()
      .select("tester_id")
      .where({ campaign_id: this.cp_id });

    const toInsert = updates.filter((update) => {
      return !payouts.map((p) => p.tester_id).includes(update.tester_id);
    });
    if (toInsert.length)
      await tryber.tables.WpAppqProspectPayout.do().insert(toInsert);

    const toUpdate = updates.filter((update) => {
      return payouts.map((p) => p.tester_id).includes(update.tester_id);
    });
    if (toUpdate.length)
      for (const update of toUpdate) {
        await tryber.tables.WpAppqProspectPayout.do()
          .where({
            tester_id: update.tester_id,
            campaign_id: update.campaign_id,
          })
          .update(update);
      }
  }

  private async sendMail() {
    const template = process.env.BOOTY_UPDATED_EMAIL;
    if (!template) return;
    const testers = await tryber.tables.WpAppqEvdProfile.do()
      .select("id", "email")
      .whereIn(
        "id",
        this.prospect.map((prospect) => prospect.tester.id)
      );
    testers.forEach((tester) => {
      sendTemplate({
        email: tester.email,
        template: template,
        subject:
          "[Tryber] Your booty and/or experience points have been updated",
      });
    });
  }
}
