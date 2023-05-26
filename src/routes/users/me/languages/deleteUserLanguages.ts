import { tryber } from "@src/features/database";

export default async (testerId: number) => {
  let deletedLanguages = tryber.tables.WpAppqProfileHasLang.do()
    .where({ profile_id: testerId })
    .delete();
  try {
    await deletedLanguages;
    return { message: "Languages successfully removed", ok: true };
  } catch (e) {
    if (process.env && process.env.DEBUG) console.log(e);
    return Promise.reject(Error("Failed to remove user Languages"));
  }
};
