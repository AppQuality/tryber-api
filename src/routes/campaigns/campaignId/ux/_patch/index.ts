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
  private _lastDraft: any;
  private _lastPublished: any;

  constructor(config: RouteClassConfiguration) {
    super(config);
    this.campaignId = Number(this.getParameters().campaign);
  }

  get lastDraft() {
    if (!this._lastDraft) return false;
    return this._lastDraft;
  }

  get lastPublished() {
    if (!this._lastPublished) return false;
    return this._lastPublished;
  }

  protected async init(): Promise<void> {
    await super.init();
    const lastDraft = await tryber.tables.UxCampaignData.do()
      .select()
      .where({
        campaign_id: this.campaignId,
        published: 0,
      })
      .orderBy("version", "desc")
      .first();
    this._lastDraft = lastDraft;

    const lastPublished = await tryber.tables.UxCampaignData.do()
      .select()
      .where({
        campaign_id: this.campaignId,
        published: 1,
      })
      .orderBy("version", "desc")
      .first();
    this._lastPublished = lastPublished;
  }

  protected async filter() {
    if (!(await this.campaignExists())) {
      return this.setNoAccessError();
    }

    if (!this.hasAccessToCampaign(this.campaignId)) {
      return this.setNoAccessError();
    }

    return true;
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
    await this.updateInsights();
    await this.updateUxVersion();

    return this.setSuccess(200, {});
  }

  private async updateInsights() {
    // case 1: save first draft
    if (
      !this.lastDraft &&
      !this.lastPublished &&
      this.getBody().status === undefined
    ) {
      await this.addInsights();
    }

    // case 2: update existing draft version
    else if (this.lastDraft && this.getBody().status === "draft") {
      await this.updateExistingInsights();
    }

    // case 3: publish current draft
    else if (this.getBody().status === "publish") {
      await this.addInsights();
    }
  }

  private async addInsights() {
    for (const insight of this.getBody().insights) {
      const data = {
        campaign_id: this.campaignId,
        version: 1,
        title: insight.title,
        description: insight.description,
        severity_id: insight.severityId,
        cluster_ids: mapClustersForInsert(insight.clusterIds),
        order: insight.order,
      };
      await tryber.tables.UxCampaignInsights.do().insert(data);
    }

    function mapClustersForInsert(clusterIds: "all" | number[]) {
      if (clusterIds === "all") return "0";
      if (Array.isArray(clusterIds) && clusterIds.length > 0)
        return clusterIds.join(",");
      throw new Error("Invalid clusterIds");
    }
  }

  private async updateExistingInsights() {
    let insightsToAdd = [];
    let insightsToUpdate = [];
    for (const insight of this.getBody().insights) {
      if (insight.id) insightsToUpdate.push(insight);
      else insightsToAdd.push(insight);
    }
    for (const insight of insightsToUpdate) {
      const insightdata = await tryber.tables.UxCampaignInsights.do()
        .select("version")
        .where({ id: insight.id })
        .first();
      if (insightdata) {
        const data = {
          campaign_id: this.campaignId,
          version: insightdata.version + 1,
          title: insight.title,
          description: insight.description,
          severity_id: insight.severityId,
          cluster_ids: mapClustersForInsert(insight.clusterIds),
          order: insight.order,
        };

        await tryber.tables.UxCampaignInsights.do()
          .update(data)
          .where({ id: insight.id });
      }
    }

    for (const insight of insightsToAdd) {
      const data = {
        campaign_id: this.campaignId,
        version: 1,
        title: insight.title,
        description: insight.description,
        severity_id: insight.severityId,
        cluster_ids: mapClustersForInsert(insight.clusterIds),
        order: insight.order,
      };
      await tryber.tables.UxCampaignInsights.do().insert(data);
    }

    function mapClustersForInsert(clusterIds: "all" | number[]) {
      if (clusterIds === "all") return "0";
      if (Array.isArray(clusterIds) && clusterIds.length > 0)
        return clusterIds.join(",");
      throw new Error("Invalid clusterIds");
    }
  }

  private async updateUxVersion() {
    // case 1: save first draft
    if (
      !this.lastDraft &&
      !this.lastPublished &&
      this.getBody().status === "draft"
    ) {
      await this.saveFirstDraft();
    }

    // case 2: update existing draft version
    else if (this.lastDraft && this.getBody().status === "draft") {
      await this.updateDraft();
    }

    // case 3: publish current draft
    else if (this.getBody().status === "publish") {
      await this.publishCurrentDraft();
    }
  }

  private async saveFirstDraft() {
    await tryber.tables.UxCampaignData.do().insert({
      campaign_id: this.campaignId,
      version: 1,
      published: 0,
    });
  }

  private async updateDraft() {
    await tryber.tables.UxCampaignData.do()
      .update({
        version: this.lastDraft ? this.lastDraft.version + 1 : 1,
      })
      .where({ campaign_id: this.campaignId });
  }
  private async publishCurrentDraft() {
    await tryber.tables.UxCampaignData.do().insert({
      campaign_id: this.campaignId,
      version: this.lastDraft ? this.lastDraft.version + 1 : 1,
      published: 1,
    });
  }
}
