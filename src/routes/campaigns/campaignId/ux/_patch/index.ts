/** OPENAPI-CLASS: patch-campaigns-campaign-ux */

import OpenapiError from "@src/features/OpenapiError";
import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";
//import UxData from "./UxData";

export default class PatchUx extends UserRoute<{
  response: StoplightOperations["patch-campaigns-campaign-ux"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["patch-campaigns-campaign-ux"]["parameters"]["path"];
  request: StoplightOperations["patch-campaigns-campaign-ux"]["requestBody"]["content"]["application/json"];
}> {
  private campaignId: number;
  //private _draft: UxData | undefined;

  constructor(config: RouteClassConfiguration) {
    super(config);
    this.campaignId = Number(this.getParameters().campaign);
  }

  // get draft() {
  //   if (!this._draft) throw new Error("Draft not initialized");
  //   return this._draft;
  // }

  protected async init(): Promise<void> {
    await super.init();
    // const item = new UxData(this.campaignId);
    // await item.lastDraft();
    // this._draft = item;
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

  // private async uxDataExists() {
  //   return this.draft?.data;
  // }

  protected async prepare(): Promise<void> {
    this.setSuccess(200, {
      // status: await this.getStatus(),
      // insight: this.draft.data?.findings || [],
      // sentiments: [],
    });
  }

  // private async getStatus() {
  //   const published = new UxData(this.campaignId);
  //   await published.lastPublished();
  //   if (!published.data) return "draft" as const;

  //   if (published.isEqual(this.draft)) return "published" as const;

  //   return "draft-modified" as const;
  // }
}
