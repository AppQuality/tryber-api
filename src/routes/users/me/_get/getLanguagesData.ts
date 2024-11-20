import { tryber } from "@src/features/database";
import * as db from "@src/features/db";

export default async (id: string) => {
  const result = await tryber.tables.WpAppqProfileHasLang.do()
    .select("language_name")
    .join(
      "wp_appq_evd_profile",
      "wp_appq_profile_has_lang.profile_id",
      "wp_appq_evd_profile.id"
    )
    .where("wp_appq_evd_profile.wp_user_id", id);

  if (!result.length) return Promise.reject(Error("Invalid language data"));

  return { languages: result.map((l) => ({ name: l.language_name })) };
};
