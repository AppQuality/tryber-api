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

    for (const s of sentiments) {
      if (s.value < 0 || s.value > 5) return true;
    }
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
    const body = this.getBody();

    if ("status" in body) {
      if (body.status === "publish") {
        await this.publish();
      }
    } else {
      await this.update();
    }

    return this.setSuccess(200, {});
  }

  private async update() {
    // if (!this.data?.data) {
    //   await this.insertFirstVersion();
    // }

    await this.updateUxData();
    await this.updateQuestions();
    await this.updateSentiments();
  }

  // private async insertFirstVersion() {
  //   const body = this.getBody();
  //   if ("status" in body) return;
  //   await tryber.tables.UxCampaignData.do().insert({
  //     goal: body.goal,
  //     users: body.usersNumber,
  //     campaign_id: this.campaignId,
  //     version: 1,
  //     published: 0,
  //     methodology_type: body.methodology.type,
  //     methodology_description: body.methodology.description,
  //   });
  //   this.version = 1;
  // }

  private async updateUxData() {
    const body = this.getBody();
    if ("status" in body) return;
    await tryber.tables.UxCampaignData.do()
      .update({
        goal: body.goal,
        users: body.usersNumber,
        // methodology_type: body.methodology.type,
        // methodology_description: body.methodology.description,
      })
      .where({
        version: this.version,
      })
      .where({ campaign_id: this.campaignId });
  }

  private async updateQuestions() {
    await this.removeQuestions();
    await this.insertNewQuestions();
  }

  private async updateSentiments() {
    await this.removeSentiments();
    await this.insertNewSentiments();
  }

  private async removeSentiments() {
    const currentSentiments = this.data?.sentiments || [];
    const currentSentimentsIds = currentSentiments.map((i) => i.id);

    if (currentSentimentsIds.length) {
      await tryber.tables.UxCampaignSentiments.do()
        .delete()
        .whereIn("id", currentSentimentsIds);
    }
  }

  private async insertNewSentiments() {
    const body = this.getBody();
    const { sentiments } = body;

    if (sentiments && sentiments.length) {
      for (const item of sentiments) {
        await tryber.tables.UxCampaignSentiments.do()
          .insert({
            campaign_id: this.campaignId,
            value: item.value,
            comment: item.comment,
            cluster_id: item.clusterId,
            version: this.version,
          })
          .returning("id");
      }
    }
  }

  private async removeQuestions() {
    const body = this.getBody();
    const { questions } = body;
    if (questions) {
      const toUpdate = questions.filter((i) => i.id);
      const currentQuestions = this.data?.questions || [];
      const currentQuestionsIds = currentQuestions.map((i) => i.id);

      const toRemove = currentQuestionsIds.filter(
        (id) => !toUpdate.map((i) => i.id).includes(id as number)
      );

      if (toRemove.length) {
        await tryber.tables.UxCampaignQuestions.do()
          .delete()
          .whereIn(
            "id",
            currentQuestionsIds.filter(
              (id) => !toUpdate.map((i) => i.id).includes(id as number)
            )
          );
      }
    }
  }

  private async insertNewQuestions() {
    const body = this.getBody();
    const { questions } = body;
    if (questions) {
      const toInsert = questions.filter((i) => !i.id);
      if (toInsert.length) {
        for (const item of toInsert) {
          await tryber.tables.UxCampaignQuestions.do()
            .insert({
              campaign_id: this.campaignId,
              question: item.name,
              version: this.version,
            })
            .returning("id");
        }
      }
    }
  }

  private async publish() {
    const draftData = this.data?.data;
    if (!draftData) {
      this.setError(400, new OpenapiError("No draft found"));
      throw new OpenapiError("No draft found");
    }

    await this.publishData();
    await this.publishQuestions();
    await this.publishSentiments();
    this.version++;
  }

  private async publishData() {
    await tryber.tables.UxCampaignData.do()
      .update({
        published: 1,
      })
      .where({
        campaign_id: this.campaignId,
        version: this.version,
      });

    await tryber.tables.UxCampaignData.do().insert({
      goal: this.data?.data?.goal,
      users: this.data?.data?.users,
      campaign_id: this.campaignId,
      version: this.version + 1,
      methodology_description: this.data?.data?.methodology_description,
      methodology_type: this.data?.data?.methodology_type,
      published: 0,
    });
  }

  private async publishQuestions() {
    if (this.data?.questions.length) {
      await tryber.tables.UxCampaignQuestions.do()
        .update({
          version: this.version + 1,
        })
        .where({
          campaign_id: this.campaignId,
          version: this.version,
        });

      for (const question of this.data?.questions || []) {
        await tryber.tables.UxCampaignQuestions.do().insert({
          campaign_id: this.campaignId,
          question: question.name,
          version: this.version,
        });
      }
    }
  }

  private async publishSentiments() {
    if (this.data?.sentiments.length) {
      await tryber.tables.UxCampaignSentiments.do()
        .update({
          version: this.version + 1,
        })
        .where({
          campaign_id: this.campaignId,
          version: this.version,
        });

      for (const sentiment of this.data?.sentiments || []) {
        await tryber.tables.UxCampaignSentiments.do().insert({
          campaign_id: this.campaignId,
          value: sentiment.value,
          cluster_id: sentiment.cluster.id,
          comment: sentiment.comment,
          version: this.version,
        });
      }
    }
  }
}
