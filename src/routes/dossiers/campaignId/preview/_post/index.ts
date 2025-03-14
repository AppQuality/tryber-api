/** OPENAPI-CLASS: post-dossiers-campaign-preview */

import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";
import UserRoute from "@src/features/routes/UserRoute";
import { PreviewPageImporter } from "@src/features/wp/Pages/PreviewPageImporter";

export default class RouteItem extends UserRoute<{
  response: StoplightOperations["post-dossiers-campaign-preview"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["post-dossiers-campaign-preview"]["parameters"]["path"];
  body: StoplightOperations["post-dossiers-campaign-preview"]["requestBody"]["content"]["application/json"];
}> {
  private campaignId: number;
  private campaignIdToImport: number;
  private accessibleCampaigns: true | number[] = this.campaignOlps
    ? this.campaignOlps
    : [];
  private _campaignToImport?: { id: number; page_preview_id: number };

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    this.campaignId = Number(this.getParameters().campaign);
    const body = this.getBody();
    this.campaignIdToImport = body.importFrom;
  }

  get campaignToImport() {
    if (!this._campaignToImport) throw new Error("Campaign not loaded");
    return this._campaignToImport;
  }

  protected async init() {
    this._campaignToImport = await tryber.tables.WpAppqEvdCampaign.do()
      .select("id", "page_preview_id")
      .where("id", this.campaignIdToImport)
      .first();
  }

  protected async filter() {
    if (!(await super.filter())) return false;

    if (
      (await this.doesNotHaveAccess()) ||
      (await this.campaignDoesNotExists())
    ) {
      this.setError(403, new OpenapiError("You are not authorized to do this"));
      return false;
    }

    return true;
  }

  private async doesNotHaveAccess() {
    if (this.accessibleCampaigns === true) return false;
    if (Array.isArray(this.accessibleCampaigns))
      return !this.accessibleCampaigns.includes(this.campaignId);
    return true;
  }

  private async campaignDoesNotExists() {
    try {
      const campaign = await tryber.tables.WpAppqEvdCampaign.do()
        .select("id")
        .where("id", this.campaignId)
        .first();
      if (!campaign) return true;
      this.campaignToImport;
      return false;
    } catch (error) {
      return true;
    }
  }

  protected async prepare() {
    try {
      const preview = new PreviewPageImporter({
        campaignId: this.campaignToImport.id,
        pageId: this.campaignToImport.page_preview_id,
        withTranslations: true,
      });
      const newPrevId = await preview.createPage();
      await tryber.tables.WpAppqEvdCampaign.do()
        .update({
          page_preview_id: newPrevId,
        })
        .where("id", this.campaignId);
      await preview.updateTitleWithCampaignId(this.campaignId);
      await preview.updateMetaWithCampaignId(this.campaignId);
    } catch (error) {
      console.log(error);
    }
    this.setSuccess(200, {});
  }
}
