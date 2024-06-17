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
  private lastDraft: UxData | undefined;
  private version: number = 0;

  constructor(config: RouteClassConfiguration) {
    super(config);
    this.campaignId = Number(this.getParameters().campaign);
  }

  protected async init() {
    await super.init();
    this.lastDraft = new UxData(this.campaignId);
    await this.lastDraft.lastDraft();
    this.version = this.lastDraft.version || 0;
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
    if ("status" in body) return false;
    const { sentiments } = body;
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
    const body = this.getBody();
    if ("status" in body) return;

    if (!this.lastDraft?.data) {
      await this.insertFirstVersion();
    }

    await this.updateUxData();
    await this.updateQuestions();
    await this.updateSentiments();
  }

  private async insertFirstVersion() {
    const body = this.getBody();
    if ("status" in body) return;
    await tryber.tables.UxCampaignData.do().insert({
      goal: body.goal,
      users: body.usersNumber,
      campaign_id: this.campaignId,
      version: 1,
      published: 0,
      methodology_type: body.methodology.type,
      methodology_description: body.methodology.description,
    });
    this.version = 1;
  }

  private async updateUxData() {
    const body = this.getBody();
    if ("status" in body) return;
    await tryber.tables.UxCampaignData.do()
      .update({
        goal: body.goal,
        users: body.usersNumber,
        methodology_type: body.methodology.type,
        methodology_description: body.methodology.description,
      })
      .where({
        version: this.version,
      })
      .where({ campaign_id: this.campaignId });
  }

  private async updateQuestions() {
    await this.removeQuestions();
    await this.insertNewQuestions();
    await this.updateExistingQuestions();
  }

  private async updateSentiments() {
    await this.removeSentiments();
    await this.insertNewSentiments();
    await this.updateExistingSentiments();
  }

  private async removeSentiments() {
    const body = this.getBody();
    if ("status" in body) return;
    const { sentiments } = body;
    const toUpdate = sentiments.filter((s) => s.id);
    const currentSentiments = this.lastDraft?.sentiments || [];
    const currentSentimentsIds = currentSentiments.map((i) => i.id);

    const toRemove = currentSentimentsIds.filter(
      (id) => !toUpdate.map((i) => i.id).includes(id as number)
    );

    if (toRemove.length) {
      await tryber.tables.UxCampaignSentiments.do()
        .delete()
        .whereIn(
          "id",
          currentSentimentsIds.filter(
            (id) => !toUpdate.map((i) => i.id).includes(id as number)
          )
        );
    }
  }

  private async insertNewSentiments() {
    const body = this.getBody();
    if ("status" in body) return;
    const { sentiments } = body;

    if (sentiments.length) {
      const toInsert = sentiments.filter((i) => !i.id);
      if (toInsert.length) {
        for (const item of toInsert) {
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
  }

  private async updateExistingSentiments() {
    const body = this.getBody();
    if ("status" in body) return;
    const { sentiments } = body;
    if (sentiments.length) {
      const updatedSentiments = sentiments.filter((i) => i.id);

      if (updatedSentiments.length) {
        for (const item of updatedSentiments) {
          await tryber.tables.UxCampaignSentiments.do()
            .update({
              value: item.value,
              cluster_id: item.clusterId,
              comment: item.comment,
              version: this.version,
            })
            .where({
              id: item.id,
            });
        }
      }
    }
  }

  private async removeQuestions() {
    const body = this.getBody();
    if ("status" in body) return;
    const { questions } = body;

    const toUpdate = questions.filter((i) => i.id);
    const currentQuestions = this.lastDraft?.questions || [];
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

  private async insertNewQuestions() {
    const body = this.getBody();
    if ("status" in body) return;
    const { questions } = body;

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

  private async updateExistingQuestions() {
    const body = this.getBody();
    if ("status" in body) return;
    const { questions } = body;
    const updatedQuestions = questions.filter((i) => i.id);

    if (updatedQuestions.length) {
      for (const item of updatedQuestions) {
        await tryber.tables.UxCampaignQuestions.do()
          .update({
            question: item.name,
            version: this.version,
          })
          .where({
            id: item.id,
          });
      }
    }
  }

  private async publish() {
    const draftData = this.lastDraft?.data;
    if (!draftData) {
      this.setError(400, new OpenapiError("No draft found"));
      throw new OpenapiError("No draft found");
    }

    await this.publishData();
    await this.publishInsight();
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
      goal: this.lastDraft?.data?.goal,
      users: this.lastDraft?.data?.users,
      campaign_id: this.campaignId,
      version: this.version + 1,
      methodology_description: this.lastDraft?.data?.methodology_description,
      methodology_type: this.lastDraft?.data?.methodology_type,
      published: 0,
    });
  }

  private async publishQuestions() {
    if (this.lastDraft?.questions.length) {
      await tryber.tables.UxCampaignQuestions.do()
        .update({
          version: this.version + 1,
        })
        .where({
          campaign_id: this.campaignId,
          version: this.version,
        });

      for (const question of this.lastDraft?.questions || []) {
        await tryber.tables.UxCampaignQuestions.do().insert({
          campaign_id: this.campaignId,
          question: question.name,
          version: this.version,
        });
      }
    }
  }

  private async publishSentiments() {
    if (this.lastDraft?.sentiments.length) {
      await tryber.tables.UxCampaignSentiments.do()
        .update({
          version: this.version + 1,
        })
        .where({
          campaign_id: this.campaignId,
          version: this.version,
        });

      for (const sentiment of this.lastDraft?.sentiments || []) {
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

  private async publishInsight() {
    const draftData = this.lastDraft?.data;
    if (!draftData) throw new OpenapiError("No draft found");

    let findingOrder = 0;
    for (const insight of draftData.findings) {
      const insertedInsight = await tryber.tables.UxCampaignInsights.do()
        .insert({
          campaign_id: this.campaignId,
          cluster_ids:
            insight.clusters === "all"
              ? "0"
              : insight.clusters.map((c) => c.id).join(","),
          description: insight.description,
          order: findingOrder++,
          severity_id: insight.severity.id,
          title: insight.title,
          version: this.version + 1,
          finding_id: insight.findingId,
        })
        .returning("id");

      const insertedInsightId = insertedInsight[0].id ?? insertedInsight[0];

      let videoPartOrder = 0;
      for (const videoPart of insight.videoParts) {
        await tryber.tables.UxCampaignVideoParts.do().insert({
          start: videoPart.start,
          end: videoPart.end,
          media_id: videoPart.mediaId,
          description: videoPart.description,
          order: videoPartOrder++,
          insight_id: insertedInsightId,
        });
      }
    }
  }
}
