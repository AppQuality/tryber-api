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

    if (await this.isThereNonExistingMediaInBody()) {
      this.setError(400, new OpenapiError(`Media not found`));
      return false;
    }

    if (this.thereAreInvalidFindingIds()) {
      this.setError(500, new OpenapiError(`Insight not found`));
      throw new OpenapiError(`Insights with idnot found`);
    }

    return true;
  }

  private async isThereNonExistingMediaInBody() {
    const body = this.getBody();
    if (!("status" in body)) {
      const { insights } = body;
      if (insights) {
        const videoParts = insights.flatMap((i) => i.videoPart || []);
        const mediaIds = videoParts.map((v) => v.mediaId);
        const media = await tryber.tables.WpAppqUserTaskMedia.do()
          .select()
          .whereIn("id", mediaIds);
        if ([...new Set(media)].length !== [...new Set(mediaIds)].length) {
          return true;
        }
      }
    }
    return false;
  }

  private thereAreInvalidFindingIds() {
    const body = this.getBody();
    if ("status" in body) return false;
    const { insights } = body;
    const toUpdate = insights.filter((i) => i.id);
    const currentInsights = this.lastDraft?.findings || [];
    const currentInsightIds = currentInsights.map((i) => i.id);

    const notFoundIds = toUpdate
      .map((i) => i.id)
      .filter((id) => !currentInsightIds.includes(id as number));

    return notFoundIds.length > 0;
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

    await this.updateInsights();
  }

  private async insertFirstVersion() {
    await tryber.tables.UxCampaignData.do().insert({
      campaign_id: this.campaignId,
      version: 1,
      published: 0,
    });
    this.version = 1;
  }

  private async updateInsights() {
    await this.removeFindings();
    await this.insertNewFindings();
    await this.updateExistingFindings();
  }

  private async removeFindings() {
    const body = this.getBody();
    if ("status" in body) return;
    const { insights } = body;

    const toUpdate = insights.filter((i) => i.id);
    const currentInsights = this.lastDraft?.findings || [];
    const currentInsightIds = currentInsights.map((i) => i.id);

    const toRemove = currentInsightIds.filter(
      (id) => !toUpdate.map((i) => i.id).includes(id as number)
    );

    if (toRemove.length) {
      await tryber.tables.UxCampaignInsights.do()
        .delete()
        .whereIn(
          "id",
          currentInsightIds.filter(
            (id) => !toUpdate.map((i) => i.id).includes(id as number)
          )
        );

      await tryber.tables.UxCampaignVideoParts.do()
        .delete()
        .whereIn(
          "insight_id",
          currentInsightIds.filter(
            (id) => !toUpdate.map((i) => i.id).includes(id as number)
          )
        );
    }
  }

  private async insertNewFindings() {
    const body = this.getBody();
    if ("status" in body) return;
    const { insights } = body;

    const toInsert = insights.filter((i) => !i.id);
    if (toInsert.length) {
      for (const item of toInsert) {
        const insight = await tryber.tables.UxCampaignInsights.do()
          .insert({
            campaign_id: this.campaignId,
            cluster_ids:
              item.clusterIds === "all" ? "0" : item.clusterIds.join(","),
            description: item.description,
            order: item.order,
            severity_id: item.severityId,
            title: item.title,
            version: this.version,
          })
          .returning("id");
        if (item.videoPart && item.videoPart.length) {
          const insightId = insight[0].id ?? insight[0];
          await tryber.tables.UxCampaignVideoParts.do().insert(
            item.videoPart.map((v) => ({
              start: v.start,
              end: v.end,
              media_id: v.mediaId,
              description: v.description,
              order: v.order,
              insight_id: insightId,
            }))
          );
        }
      }
    }
  }

  private async updateExistingFindings() {
    const body = this.getBody();
    if ("status" in body) return;
    const { insights } = body;
    const updatedFindings = insights.filter((i) => i.id);

    if (updatedFindings.length) {
      for (const item of updatedFindings) {
        await tryber.tables.UxCampaignInsights.do()
          .update({
            cluster_ids:
              item.clusterIds === "all" ? "0" : item.clusterIds.join(","),
            description: item.description,
            order: item.order,
            severity_id: item.severityId,
            title: item.title,
            version: this.version,
          })
          .where({
            id: item.id,
          });

        const newVideoParts = item.videoPart.filter((i) => !i.id);

        if (newVideoParts.length) {
          await tryber.tables.UxCampaignVideoParts.do().insert(
            newVideoParts.map((v) => ({
              start: v.start,
              end: v.end,
              media_id: v.mediaId,
              description: v.description,
              order: v.order,
              insight_id: item.id,
            }))
          );
        }
        const updatedVideoParts = item.videoPart.filter((i) => i.id);

        const currentVideoParts = (this.lastDraft?.findings || []).flatMap(
          (f) => (f.id == item.id && f.videoPart ? f.videoPart : [])
        );

        const currentVideoPartIds = currentVideoParts.map((i) => i.id);
        const updatedVideoPartsIds = updatedVideoParts.map((i) => i.id);

        const toRemove = currentVideoPartIds.filter(
          (id) => !updatedVideoPartsIds.includes(id as number)
        );

        if (toRemove.length) {
          await tryber.tables.UxCampaignVideoParts.do()
            .delete()
            .whereIn("id", toRemove);
        }

        for (const videoPart of updatedVideoParts) {
          await tryber.tables.UxCampaignVideoParts.do()
            .update({
              start: videoPart.start,
              end: videoPart.end,
              media_id: videoPart.mediaId,
              description: videoPart.description,
              order: videoPart.order,
              insight_id: item.id,
            })
            .where({
              id: videoPart.id,
            });
        }
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
      campaign_id: this.campaignId,
      version: this.version + 1,
      published: 0,
    });
  }

  private async publishInsight() {
    const draftData = this.lastDraft?.data;
    console.log(
      "🚀 ~ file: index.ts:320 ~ PatchUx ~ publishInsight ~ draftData:",
      draftData
    );
    if (!draftData) throw new OpenapiError("No draft found");

    let findingOrder = 0;
    for (const insight of draftData.findings) {
      const insertedInsight = await tryber.tables.UxCampaignInsights.do()
        .insert({
          campaign_id: this.campaignId,
          cluster_ids:
            insight.cluster === "all"
              ? "0"
              : insight.cluster.map((c) => c.id).join(","),
          description: insight.description,
          order: findingOrder++,
          severity_id: insight.severity.id,
          title: insight.title,
          version: this.version + 1,
        })
        .returning("id");

      const insertedInsightId = insertedInsight[0].id ?? insertedInsight[0];
      console.log(
        "🚀 ~ file: index.ts:340 ~ PatchUx ~ publishInsight ~ insertedInsightId:",
        insertedInsightId
      );

      let videoPartOrder = 0;
      for (const videoPart of insight.videoPart) {
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
