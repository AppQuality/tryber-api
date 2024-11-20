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

  protected async prepare() {
    await this.insertNewLanguages();

    const userLanguages = await this.getUserLanguages();
    this.setSuccess(
      200,
      userLanguages.map((lang) => ({ name: lang.language_name }))
    );
  }

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
