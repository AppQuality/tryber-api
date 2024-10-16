import { tryber } from "@src/features/database";
import * as db from "@src/features/db";

export default async (id: string) => {
  const result = await tryber.tables.WpAppqProfileHasLang.do()
    .select("language_name")
    .where("profile_id", id);

  if (!result.length) return Promise.reject(Error("Invalid language data"));

  return { languages: result.map((l) => ({ name: l.language_name })) };
};
