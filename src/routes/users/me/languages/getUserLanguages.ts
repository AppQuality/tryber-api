import { tryber } from "@src/features/database";

export default async (testerId: number) => {
  try {
    const testerLanguages = await tryber.tables.WpAppqProfileHasLang.do()
      .select(
        tryber.ref("id").withSchema("wp_appq_lang").as("id"),
        tryber.ref("display_name").withSchema("wp_appq_lang").as("name")
      )
      .join(
        "wp_appq_lang",
        "wp_appq_lang.id",
        "wp_appq_profile_has_lang.language_id"
      )
      .where({ profile_id: testerId });

    if (!testerLanguages.length) return [];
    return testerLanguages;
  } catch (error) {
    if (process.env && process.env.DEBUG) console.log(error);
    throw error;
  }
};
