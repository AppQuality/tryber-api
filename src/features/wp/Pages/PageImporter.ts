import { tryber } from "@src/features/database";
import crypto from "crypto";
import { serialize, unserialize } from "php-serialize";

export class PageImporter {
  private oldCampaignId: number = 0;
  protected fromId: number = 0;
  private withTranslations: boolean = false;

  private newId: number = 0;

  private translations: { [key: string]: number } = {};

  constructor({
    campaignId,
    pageId,
    withTranslations,
  }: {
    campaignId: number;
    pageId: number;
    withTranslations?: boolean;
  }) {
    this.oldCampaignId = campaignId;
    this.fromId = pageId;
    this.withTranslations = withTranslations ?? false;
  }

  async createPage() {
    const page = await tryber.tables.WpPosts.do()
      .select()
      .where("ID", this.fromId)
      .first();

    if (!page) throw new Error("Page not found");

    const { ID, ...rest } = page;

    const newPage = await tryber.tables.WpPosts.do()
      .insert({
        ...rest,
        post_name: "",
        post_status: "draft",
      })
      .returning("ID");

    const meta = await tryber.tables.WpPostmeta.do()
      .select()
      .where("post_id", ID);

    if (meta.length) {
      await tryber.tables.WpPostmeta.do().insert(
        meta.map((metaItem) => {
          const { meta_id, ...rest } = metaItem;
          return {
            ...rest,
            post_id: newPage[0].ID ?? newPage[0],
          };
        })
      );
    }

    const newId = newPage[0].ID ?? newPage[0];
    this.newId = newId;

    if (this.withTranslations) {
      await this.linkTranslations();
    }
    return newId;
  }

  protected getTranslationLanguages() {
    return Object.keys(this.translations).map((lang) => ({
      lang,
    }));
  }

  protected async updateTitle(lang: string, title: (old: string) => string) {
    if (!this.translations[lang]) return;
    const oldTitle = await tryber.tables.WpPosts.do()
      .select("post_title")
      .where("ID", this.translations[lang])
      .first();
    if (!oldTitle) return;
    const newTitle = title(oldTitle.post_title);
    await tryber.tables.WpPosts.do()
      .update({ post_title: newTitle })
      .where("ID", this.translations[lang]);
  }

  protected async updateMeta(lang: string, meta: { [key: string]: string }) {
    if (!this.translations[lang]) return;
    for (const key in meta) {
      await tryber.tables.WpPostmeta.do()
        .update({ meta_value: meta[key] })
        .where("post_id", this.translations[lang])
        .where("meta_key", key);
    }
  }

  private async linkTranslations() {
    const defaultLanguage = await this.getDefaultLanguage();
    if (!defaultLanguage) return;

    const languages = await this.getPolylangLanguages();
    const manualTranslations: { [key: string]: number } = {
      [defaultLanguage]: this.newId,
    };
    const parsedTranslations = await this.getPageTranslationIds({
      pageId: this.fromId,
      defaultLanguage,
    });
    for (const t in parsedTranslations) {
      const translation = new PageImporter({
        campaignId: this.oldCampaignId,
        pageId: parsedTranslations[t],
      });
      const newTranslationId = await translation.createPage();
      if (newTranslationId) manualTranslations[t] = newTranslationId;
    }
    await this.createPolylangTranslations({
      id: this.newId,
      translations: manualTranslations,
      languages,
    });
    this.translations = manualTranslations;
  }

  private async getDefaultLanguage() {
    const polylangOptions = await tryber.tables.WpOptions.do()
      .select("option_value")
      .where("option_name", "polylang")
      .first();

    if (!polylangOptions) return false;
    let parsedOptions: { [key: string]: any } = {};
    try {
      parsedOptions = unserialize(polylangOptions.option_value);
    } catch (e) {
      return false;
    }
    if (!("default_lang" in parsedOptions)) return false;
    return parsedOptions.default_lang;
  }

  private async getPolylangLanguages() {
    const languages = await tryber.tables.WpTermTaxonomy.do()
      .select("term_id", "description")
      .where("taxonomy", "language");

    let parsedLanguages: { [key: string]: number } = {};
    for (const language of languages) {
      try {
        const lang = unserialize(language.description);
        if ("locale" in lang)
          parsedLanguages[lang.locale.split("_")[0]] = language.term_id;
      } catch (e) {
        continue;
      }
    }
    return parsedLanguages;
  }

  private async createPolylangTranslations({
    id,
    translations,
    languages,
  }: {
    id: number;
    translations: { [key: string]: number };
    languages: { [key: string]: any };
  }) {
    const term_name = crypto
      .createHash("md5")
      .update(id.toString())
      .digest("hex");
    const term = await tryber.tables.WpTerms.do()
      .insert({
        name: `pll_${term_name}`,
        slug: `pll_${term_name}`,
      })
      .returning("term_id");

    const term_id = term[0].term_id ?? term[0];

    await tryber.tables.WpTermTaxonomy.do().insert({
      term_id: term_id,
      term_taxonomy_id: term_id,
      taxonomy: "post_translations",
      description: serialize(translations),
    });

    for (const trans of Object.keys(translations)) {
      const transId = translations[trans];
      const langId = trans in languages ? languages[trans] : false;
      if (langId) {
        await tryber.tables.WpTermRelationships.do().insert({
          object_id: transId,
          term_taxonomy_id: langId,
        });
        await tryber.tables.WpTermRelationships.do().insert({
          object_id: transId,
          term_taxonomy_id: term_id,
        });
      }
    }
  }

  private async getPageTranslationIds({
    pageId,
    defaultLanguage,
  }: {
    pageId: number;
    defaultLanguage: string;
  }) {
    const translations = await tryber.tables.WpTermRelationships.do()
      .select("object_id", "description")
      .join(
        "wp_term_taxonomy",
        "wp_term_taxonomy.term_taxonomy_id",
        "wp_term_relationships.term_taxonomy_id"
      )
      .where("object_id", pageId)
      .where("taxonomy", "post_translations")
      .first();

    if (!translations) return {};

    let parsedTranslations: { [key: string]: any } = {};
    try {
      parsedTranslations = unserialize(translations.description);
    } catch (e) {
      return;
    }

    if (defaultLanguage in parsedTranslations)
      delete parsedTranslations[defaultLanguage];
    return parsedTranslations;
  }

  public async updateTitleWithCampaignId(campaignId: number) {
    const langs = this.getTranslationLanguages();
    for (const { lang } of langs) {
      await this.updateTitle(lang, (old) =>
        old.replace(this.oldCampaignId.toString(), campaignId.toString())
      );
    }
  }

  public async updateMetaWithCampaignId(campaignId: number) {}
}
