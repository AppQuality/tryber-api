/** OPENAPI-ROUTE:put-users-me-languages */
import { Context } from "openapi-backend";
import * as db from "../../../../../features/db";
import deleteUserLanguages from "../deleteUserLanguages";
import getAvailableLanguages from "../getAvailableLanguages";
import getUserLanguages from "../getUserLanguages";

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  try {
    // 0. check if id to insert exists
    let langs = (await getAvailableLanguages()).map((l) => l.id);
    const newLangs = [...new Set(req.body)]; //remove duplicated entries
    newLangs.forEach((nl) => {
      if (langs.indexOf(nl as string) === -1) {
        throw new Error("Bad request: lang_id=" + nl + " not found.");
      }
    });
    // 1. delete all user languages
    let data = await deleteUserLanguages(req.user.testerId);

    // 2. insert new user languages
    if (newLangs.length) {
      let insertData: string[] = [];
      let insertSql = `INSERT INTO wp_appq_profile_has_lang (language_id, profile_id)  VALUES `;
      let valuesSql: string[] = [];
      newLangs.forEach((nl) => {
        valuesSql.push(`(?, ?)`);
        insertData.push(nl as string, req.user.testerId.toString());
      });
      let inserted;
      try {
        inserted = await db.query(
          db.format(insertSql + valuesSql.join(", ") + `;`, insertData)
        );
      } catch (e) {
        if (process.env && process.env.DEBUG) console.log(e);
        if (
          (e as MySqlError).hasOwnProperty("code") &&
          (e as MySqlError).code == "ER_DUP_ENTRY"
        ) {
          return Promise.reject(
            Error(
              "Failed. Duplication entry. Languages already assigned to the tester."
            )
          );
        }
        return Promise.reject(Error("Failed to add user Language"));
      }
    }

    // 3. return user languages
    let languages = await getUserLanguages(req.user.testerId);
    res.status_code = 200;
    return languages.map((l) => ({ id: l.id, name: l.name }));
  } catch (error) {
    res.status_code = (error as OpenapiError).status_code || 500;
    return {
      element: "languages",
      id: parseInt(req.user.ID),
      message: (error as OpenapiError).message,
    };
  }
};
