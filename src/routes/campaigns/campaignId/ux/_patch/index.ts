/** OPENAPI-CLASS: patch-campaigns-campaign-ux */

import OpenapiError from "@src/features/OpenapiError";
import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";
import UxData from "../UxData";

export default class PatchUx extends UserRoute<{
  response: StoplightOperations["patch-campaigns-campaign-ux"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["patch-campaigns-campaign-ux"]["parameters"]["path"];
  body: StoplightOperations["patch-campaigns-campaign-ux"]["requestBody"]["content"]["application/json"];
}> {
  private campaignId: number;
  private data: UxData | undefined;
  private version: number = 0;

  constructor(config: RouteClassConfiguration) {
    super(config);
    this.campaignId = Number(this.getParameters().campaign);
  }

  protected async init() {
    await super.init();
    this.data = new UxData(this.campaignId);
    await this.data.lastPublished();
    if (!this.data.data) await this.data.lastDraft();
    this.version = this.data.version || 1;
  }

  protected async filter() {
    if (!(await this.campaignExists())) {
      return this.setNoAccessError();
    }

    if (!this.hasAccessToCampaign(this.campaignId)) {
      return this.setNoAccessError();
    }

    if (this.invalidSentimentsValues()) {
      this.setError(500, new OpenapiError(`Sentiment values are invalid`));
      throw new OpenapiError(`Sentiment values are invalid`);
    }

    return true;
  }

  private invalidSentimentsValues() {
    const body = this.getBody();
    const { sentiments } = body;

    if (!sentiments) return false;

    return sentiments.some((s) => s.value < 1 || s.value > 5);
  }

  private setNoAccessError() {
    this.setError(
      403,
      new OpenapiError("You don't have access to this campaign")
    );
    return false;
  }

  private async campaignExists() {
    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select("id")
      .where({
        id: this.campaignId,
      })
      .first();
    return !!campaign;
  }

  protected async prepare(): Promise<void> {
    if (!this.data?.data) {
      await this.insertNewUxData();
    } else {
      await this.updateUxData();
    }

    await this.updateQuestions();
    await this.updateSentiments();
    await this.updateVisibleStatus();
    return this.setSuccess(200, {});
  }

  private async insertNewUxData() {
    const body = this.getBody();

    if (
      !body.methodology ||
      !body.methodology.type ||
      !body.methodology.description
    ) {
      this.setError(400, new OpenapiError("Methodology is required"));
      throw new OpenapiError("Methodology is required");
    }
    if (!body.goal) {
      this.setError(400, new OpenapiError("Goal is required"));
      throw new OpenapiError("Goal is required");
    }
    if (!("usersNumber" in body)) {
      this.setError(400, new OpenapiError("Users number is required"));
      throw new OpenapiError("Users number is required");
    }
    if (!("visible" in body)) {
      this.setError(400, new OpenapiError("Visible status is required"));
      throw new OpenapiError("Visible status is required");
    }
    await tryber.tables.UxCampaignData.do().insert({
      goal: body.goal,
      users: body.usersNumber,
      campaign_id: this.campaignId,
      version: 1,
      published: 0,
      methodology_type: body.methodology.type,
      methodology_description: body.methodology.description,
    });
  }

  private async updateUxData() {
    const body = this.getBody();

    let uxDataToUpdate = {};
    if (body.methodology)
      uxDataToUpdate = {
        methodology_type: body.methodology.type,
        methodology_description: body.methodology.description,
      };
    if (body.goal) {
      uxDataToUpdate = {
        ...uxDataToUpdate,
        goal: body.goal,
      };
    }
    if (body.usersNumber) {
      uxDataToUpdate = {
        ...uxDataToUpdate,
        users: body.usersNumber,
      };
    }
    await tryber.tables.UxCampaignData.do()
      .update({
        ...uxDataToUpdate,
        version: this.version,
      })
      .where({
        version: this.version,
      })
      .where({ campaign_id: this.campaignId });
  }

  private async updateQuestions() {
    const body = this.getBody();
    if ("questions" in body) {
      await this.removeQuestions();
      await this.insertNewQuestions();
    }
  }

  private async updateSentiments() {
    const body = this.getBody();
    if ("sentiments" in body) {
      await this.removeSentiments();
      await this.insertNewSentiments();
    }
  }

  private async removeSentiments() {
    await tryber.tables.UxCampaignSentiments.do()
      .delete()
      .where("campaign_id", this.campaignId);
  }

  private async insertNewSentiments() {
    const body = this.getBody();
    const { sentiments } = body;

    if (sentiments && sentiments.length) {
      for (const item of sentiments) {
        await tryber.tables.UxCampaignSentiments.do().insert({
          campaign_id: this.campaignId,
          value: item.value,
          comment: item.comment,
          cluster_id: item.clusterId,
          version: this.version,
        });
      }
    }
  }

  private async removeQuestions() {
    await tryber.tables.UxCampaignQuestions.do()
      .delete()
      .where("campaign_id", this.campaignId);
  }

  private async insertNewQuestions() {
    const body = this.getBody();
    const { questions } = body;
    if (questions && questions.length) {
      for (const item of questions) {
        await tryber.tables.UxCampaignQuestions.do().insert({
          campaign_id: this.campaignId,
          question: item.name,
          version: this.version,
        });
      }
    }
  }

  private async updateVisibleStatus() {
    const body = this.getBody();
    if ("visible" in body) {
      await tryber.tables.UxCampaignData.do()
        .update({
          published: body.visible,
        })
        .where("campaign_id", this.campaignId);
    }
  }
}
