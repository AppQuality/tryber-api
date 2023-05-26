import { tryber } from "@src/features/database";

export default async () => {
  try {
    const languages = await tryber.tables.WpAppqLang.do().select(
      "id",
      tryber.ref("display_name").withSchema("wp_appq_lang").as("name")
    );

    if (!languages.length) throw Error("No languages");
    return languages;
  } catch (error) {
    if (process.env && process.env.DEBUG) console.log(error);
    throw error;
  }
};
