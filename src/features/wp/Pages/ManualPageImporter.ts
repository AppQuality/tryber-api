import { PageImporter } from "./PageImporter";

export class ManualPageImporter extends PageImporter {
  public async updateMetaWithCampaignId(campaignId: number) {
    const manualLangs = this.getTranslationLanguages();
    for (const { lang } of manualLangs) {
      await this.updateMeta(lang, {
        man_campaign_id: campaignId.toString(),
      });
    }
  }
}
