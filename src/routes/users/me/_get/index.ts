/**  OPENAPI-CLASS : get-users-me */

import UserRoute from "@src/features/routes/UserRoute";
import debugMessage from "@src/features/debugMessage";
import { tryber } from "@src/features/database";
import UserData from "@src/routes/users/UserData";

const basicFields = [
  "email" as const,
  "is_verified" as const,
  "name" as const,
  "surname" as const,
  "username" as const,
  "wp_user_id" as const,
];
const acceptedFields = [
  ...basicFields,
  "additional" as const,
  "all" as const,
  "approved_bugs" as const,
  "attended_cp" as const,
  "birthDate" as const,
  "booty" as const,
  "booty_threshold" as const,
  "certifications" as const,
  "city" as const,
  "country" as const,
  "education" as const,
  "gender" as const,
  "image" as const,
  "languages" as const,
  "onboarding_completed" as const,
  "pending_booty" as const,
  "phone" as const,
  "profession" as const,
  "rank" as const,
  "role" as const,
  "total_exp_pts" as const,
];
type AcceptableValues = typeof acceptedFields[number];

export default class UsersMe extends UserRoute<{
  response: StoplightOperations["get-users-me"]["responses"]["200"]["content"]["application/json"];
  query: StoplightOperations["get-users-me"]["parameters"]["query"];
}> {
  private _fields: AcceptableValues[] | undefined = undefined;

  constructor(configuration: RouteClassConfiguration) {
    super({ ...configuration, element: "users-me" });
    this.setValidFields();
  }

  private setValidFields() {
    const query = this.getQuery();
    this._fields = basicFields;

    if (query && query.fields) {
      this._fields = query.fields
        .split(",")
        .filter((f) =>
          acceptedFields.includes(f as AcceptableValues)
        ) as AcceptableValues[];

      if (this._fields.includes("all")) {
        this._fields = acceptedFields.filter((f) => f !== "all");
      }
    }
  }

  get fields() {
    if (!this._fields) throw new Error("Fields not initialized");
    return this._fields;
  }

  protected async prepare() {
    await this.updateLastActivity();
    this.setSuccess(200, await this.getUserData());
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

  protected async getUserData() {
    const user = new UserData(this.getTesterId(), this.fields);
    try {
      let data: StoplightOperations["get-users-me"]["responses"]["200"]["content"]["application/json"] =
        { id: this.getTesterId(), role: this.configuration.request.user.role };
      data = { ...data, ...(await user.getData()) };

      return data;
    } catch (e) {
      if (process.env && process.env.NODE_ENV === "development") {
        console.log(e);
      }
      throw e;
    }
  }
}
