/** OPENAPI-CLASS: put-campaigns-campaign-prospect-testerId */
import OpenapiError from "@src/features/OpenapiError";
import UserRoute from "@src/features/routes/UserRoute";
import { tryber } from "@src/features/database";

export default class RouteItem extends UserRoute<{
  response: StoplightOperations["put-campaigns-campaign-prospect-testerId"]["responses"][200]["content"]["application/json"];
  parameters: StoplightOperations["put-campaigns-campaign-prospect-testerId"]["parameters"]["path"];
  body: StoplightOperations["put-campaigns-campaign-prospect-testerId"]["requestBody"]["content"]["application/json"];
}> {
  private campaignId: number;
  private tester: number;

  constructor(config: RouteClassConfiguration) {
    super(config);
    this.campaignId = parseInt(this.getParameters().campaign);
    this.tester = parseInt(this.getParameters().testerId);
  }

  protected async init() {
    await this.failIfCampaignDoesNotExist();
    await this.failIfTesterIsNotSelected();
    await this.failIfThereIsAnOldProspect();
  }

  private async failIfCampaignDoesNotExist() {
    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select("id")
      .where("id", this.campaignId)
      .first();
    if (!campaign) {
      const error = new OpenapiError("You are not authorized.");
      this.setError(403, error);
      throw error;
    }
  }

  private async failIfTesterIsNotSelected() {
    const candidate = await tryber.tables.WpCrowdAppqHasCandidate.do()
      .select()
      .join(
        "wp_appq_evd_profile",
        "wp_appq_evd_profile.wp_user_id",
        "wp_crowd_appq_has_candidate.user_id"
      )
      .where("campaign_id", this.campaignId)
      .where("wp_appq_evd_profile.id", this.tester)
      .first();
    if (!candidate) {
      const error = new OpenapiError("You are not authorized.");
      this.setError(403, error);
      throw error;
    }
  }

  private async failIfThereIsAnOldProspect() {
    const oldProspectData = await tryber.tables.WpAppqProspectPayout.do()
      .select("id")
      .where("campaign_id", this.campaignId)
      .where("is_edit", ">", 0);
    if (oldProspectData.length > 0) {
      const error = new OpenapiError(
        "There is already an edit in old prospect."
      );
      this.setError(412, error);
      throw error;
    }
  }

  protected async filter() {
    if (!this.hasAccessTesterSelection(this.campaignId)) {
      this.setError(403, new OpenapiError("You are not authorized."));
      return false;
    }
    return true;
  }

  protected async prepare() {
    const prospectRow = await this.updateProspectRow();

    if (!prospectRow) {
      const error = new OpenapiError("There was an error updating prospect.");
      return this.setError(500, error);
    }

    this.setSuccess(200, {
      payout: {
        completion: prospectRow.complete_eur,
        bugs: prospectRow.bonus_bug_eur,
        refund: prospectRow.refund,
        extra: prospectRow.extra_eur,
      },
      experience: {
        completion: prospectRow.complete_pts,
        extra: prospectRow.extra_pts,
      },
      note: prospectRow.notes,
      completed: prospectRow.is_completed === 1,
    });
  }

  private async updateProspectRow() {
    const body = this.getBody();
    if (!(await this.getProspectRow())) {
      await tryber.tables.WpAppqProspectPayout.do().insert({
        campaign_id: this.campaignId,
        tester_id: this.tester,
        is_edit: 0,
        complete_pts: body.experience.completion,
        extra_pts: body.experience.extra,
        complete_eur: body.payout.completion,
        extra_eur: body.payout.extra,
        refund: body.payout.refund,
        bonus_bug_eur: body.payout.bugs,
        notes: body.note,
        is_completed: body.completed ? 1 : 0,
      });
    } else {
      await tryber.tables.WpAppqProspectPayout.do()
        .update({
          is_edit: 0,
          complete_pts: body.experience.completion,
          extra_pts: body.experience.extra,
          complete_eur: body.payout.completion,
          extra_eur: body.payout.extra,
          refund: body.payout.refund,
          bonus_bug_eur: body.payout.bugs,
          notes: body.note,
          is_completed: body.completed ? 1 : 0,
        })
        .where("campaign_id", this.campaignId)
        .where("tester_id", this.tester);
    }

    return await this.getProspectRow();
  }

  private async getProspectRow() {
    return await tryber.tables.WpAppqProspectPayout.do()
      .select()
      .where("campaign_id", this.campaignId)
      .where("tester_id", this.tester)
      .first();
  }
}
