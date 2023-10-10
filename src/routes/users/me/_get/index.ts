/**  OPENAPI-CLASS : get-users-me */

import UserRoute from "@src/features/routes/UserRoute";
import getUserData from "./getUserData";
import debugMessage from "@src/features/debugMessage";
import { tryber } from "@src/features/database";

export default class UsersMe extends UserRoute<{
  response: StoplightOperations["get-users-me"]["responses"]["200"]["content"]["application/json"];
  query: StoplightOperations["get-users-me"]["parameters"]["query"];
}> {
  protected async prepare() {
    let query = this.getQuery();
    let fields = query.fields ? query.fields.split(",") : false;

    await this.updateLastActivity();

    try {
      const user = await getUserData(this.getWordpressId().toString(), fields);
      this.setSuccess(200, {
        ...user,
        role: this.configuration.request.user.role,
      });
    } catch (err) {
      debugMessage(err);
      this.setError(
        (err as OpenapiError).status_code || 404,
        err as OpenapiError
      );
    }
  }

  protected async updateLastActivity() {
    try {
      await tryber.tables.WpAppqEvdProfile.do()
        .update({ last_activity: tryber.fn.now() })
        .where({ id: this.getTesterId() });
    } catch (err) {
      debugMessage(err);
      this.setError(
        (err as OpenapiError).status_code || 404,
        err as OpenapiError
      );
    }
  }
}
