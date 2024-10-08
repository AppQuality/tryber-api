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

  constructor(config: RouteClassConfiguration) {
    super(config);
    this.campaignId = Number(this.getParameters().campaign);
  }

  protected async init() {
    await super.init();
    this.data = new UxData(this.campaignId);
    await this.data.getLast();
  }

  protected async filter() {
    if (!(await this.campaignExists())) {
      return this.setNoAccessError();
    }

    if (!this.hasAccessToCampaign(this.campaignId)) {
      return this.setNoAccessError();
    }

    if (!this.isBodyValid()) {
      this.setError(400, new OpenapiError(`Body is invalid`));
      return false;
    }

    if (this.invalidSentimentsValues()) {
      this.setError(500, new OpenapiError(`Sentiment values are invalid`));
      throw new OpenapiError(`Sentiment values are invalid`);
    }

    return true;
  }

  private isBodyValid() {
    const body = this.getBody();
    return (
      body &&
      (body.goal ||
        body.usersNumber ||
        body.methodology ||
        body.sentiments ||
        body.questions ||
        typeof body.visible !== "undefined")
    );
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
      published: body.visible,
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
    if ("visible" in body) {
      uxDataToUpdate = {
        ...uxDataToUpdate,
        published: body.visible,
      };
    }
    if (Object.keys(uxDataToUpdate).length === 0) return;
    await tryber.tables.UxCampaignData.do()
      .update({
        ...uxDataToUpdate,
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
    const clusters_ids = await this.getClustersIds();

    if (clusters_ids.length && sentiments && sentiments.length) {
      for (const item of sentiments) {
        if (clusters_ids.includes(item.clusterId)) {
          await tryber.tables.UxCampaignSentiments.do().insert({
            campaign_id: this.campaignId,
            value: item.value,
            comment: item.comment,
            cluster_id: item.clusterId,
          });
        }
      }
    }
  }

  private async getClustersIds() {
    const ids = await tryber.tables.WpAppqCampaignTask.do().select("id").where({
      campaign_id: this.campaignId,
    });
    return ids.map((c) => c.id) || [];
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
        });
      }
    }
  }
}
