/** OPENAPI-CLASS:put-users-me-languages */

import OpenapiError from "@src/features/OpenapiError";
import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";

export default class UserLanguagesRoute extends UserRoute<{
  response: StoplightOperations["put-users-me-languages"]["responses"]["200"]["content"]["application/json"];
  body: StoplightOperations["put-users-me-languages"]["requestBody"]["content"]["application/json"];
}> {
  private languages: string[] | undefined;

  private constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    const body = this.getBody();
    if (body) {
      this.languages = [...new Set(body)];
    }
  }

  /* protected async filter() {
    if (await this.desiredLanguagesDoesNotExist()) return false;
    return true;
  }

  protected async desiredLanguagesDoesNotExist() {
    if (!this.languages) return false;

   const availableLanguagesIds = await this.getAvailableLanguages();

    const everyLanguageExists = this.languages.every((nl) =>
      availableLanguagesIds.includes(nl)
    );

    if (!everyLanguageExists) {
      this.setError(404, new OpenapiError(`Bad request: lang_id not found.`));
      return true;
    }

    return false;
  }
    */

  protected async prepare() {
    await this.insertNewLanguages();

    const userLanguages = await this.getUserLanguages();
    this.setSuccess(
      200,
      userLanguages.map((lang) => ({ name: lang.language_name }))
    );
  }

  /* protected async getAvailableLanguages() {
    const languages = await tryber.tables.WpAppqLang.do().select(
      "id",
      tryber.ref("display_name").withSchema("wp_appq_lang").as("name")
    );

    if (!languages.length) throw Error("No languages");
    return languages.map((l) => l.id);
  }*/

  protected async getUserLanguages() {
    const testerLanguages = await tryber.tables.WpAppqProfileHasLang.do()
      .select("language_name")
      .where({ profile_id: this.getTesterId() });

    return testerLanguages;
  }

  protected async insertNewLanguages() {
    await this.deleteUserLanguages();
    if (!this.languages || !this.languages.length) return undefined;

    const values = this.languages.map((nl) => {
      return {
        language_id: -1,
        language_name: nl,
        profile_id: this.getTesterId(),
      };
    });

    await tryber.tables.WpAppqProfileHasLang.do().insert(values);
  }

  protected async deleteUserLanguages() {
    await tryber.tables.WpAppqProfileHasLang.do()
      .where({ profile_id: this.getTesterId() })
      .delete();
    return true;
  }
}
