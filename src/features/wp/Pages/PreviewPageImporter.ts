import { PageImporter } from "./PageImporter";

export class PreviewPageImporter extends PageImporter {
  public async updateMetaWithCampaignId(campaignId: number) {
    const manualLangs = this.getTranslationLanguages();
    for (const { lang } of manualLangs) {
      await this.updateMeta(lang, {
        preview_campaign_id: campaignId.toString(),
      });
    }
  }
}
