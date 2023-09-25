import { tryber } from "@src/features/database";

export default async (id: string) => {
  const data = await tryber.tables.WpAppqProfileHasLang.do()
    .select(
      tryber.ref("display_name").withSchema("wp_appq_lang").as("language"),
      tryber.ref("id").withSchema("wp_appq_lang")
    )
    .as("id")
    .join(
      "wp_appq_evd_profile",
      "wp_appq_evd_profile.id",
      "wp_appq_profile_has_lang.profile_id"
    )
    .join(
      "wp_appq_lang",
      "wp_appq_lang.id",
      "wp_appq_profile_has_lang.language_id"
    )
    .where("wp_appq_evd_profile.wp_user_id", id);

  try {
    if (!data.length) return Promise.reject(Error("Invalid language data"));
    return {
      languages: data.map((l: { id: number; language: string }) => ({
        id: l.id,
        name: l.language,
      })),
    };
  } catch (e) {
    return Promise.reject(e);
  }
};
