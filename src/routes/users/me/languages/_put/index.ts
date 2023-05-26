/** OPENAPI-CLASS:put-users-me-languages */

import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";
import OpenapiError from "@src/features/OpenapiError";

export default class UserLanguagesRoute extends UserRoute<{
  response: StoplightOperations["put-users-me-languages"]["responses"]["200"]["content"]["application/json"];
  body: StoplightOperations["put-users-me-languages"]["requestBody"]["content"]["application/json"];
}> {
  protected async filter() {
    if (await this.desiredLanguagesDoesNotExist()) return false;
    return true;
  }

  protected async desiredLanguagesDoesNotExist() {
    const desiredLanguages = this.getBody();
    if (desiredLanguages.length) {
      let langs = (await this.getAvailableLanguages()).map((l) => l.id);
      const newLangs = [...new Set(desiredLanguages)]; //remove duplicated entries
      let notFound = 0;
      newLangs.forEach((nl) => {
        if (!langs.includes(nl)) {
          notFound = nl;
        }
      });
      if (notFound) {
        this.setError(
          404,
          new OpenapiError(`Bad request: lang_id=${notFound} not found.`)
        );
        return true;
      }
    }

    return false;
  }

  protected async prepare() {
    try {
      await this.deleteUserLanguages();
      await this.insertNewLanguages();

      this.setSuccess(200, await this.getUserLanguages());
    } catch (error) {
      this.setError(404, error as OpenapiError);
    }
  }

  protected async getAvailableLanguages() {
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
  }

  protected async getUserLanguages() {
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
        .where({ profile_id: this.getTesterId() });

      if (!testerLanguages.length) return [];
      return testerLanguages;
    } catch (error) {
      if (process.env && process.env.DEBUG) console.log(error);
      throw error;
    }
  }

  protected async deleteUserLanguages() {
    let deletedLanguages = tryber.tables.WpAppqProfileHasLang.do()
      .where({ profile_id: this.getTesterId() })
      .delete();
    try {
      await deletedLanguages;
      return { message: "Languages successfully removed", ok: true };
    } catch (e) {
      if (process.env && process.env.DEBUG) console.log(e);
      return Promise.reject(Error("Failed to remove user Languages"));
    }
  }

  protected async insertNewLanguages() {
    const newLangs = [...new Set(this.getBody())];

    if (newLangs.length) {
      let insertSql = tryber.tables.WpAppqProfileHasLang.do();

      const values = newLangs.map((nl) => {
        return { language_id: nl, profile_id: this.getTesterId() };
      });
      insertSql = insertSql.insert(values);

      try {
        await insertSql;
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
  }
}
