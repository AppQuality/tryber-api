/** OPENAPI-CLASS: get-languages */

import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";
import OpenapiError from "@src/features/OpenapiError";

export default class Route extends UserRoute<{
  response: StoplightOperations["get-languages"]["responses"]["200"]["content"]["application/json"];
}> {
  constructor(configuration: RouteClassConfiguration) {
    super({ ...configuration, element: "languagues" });
    this.setId(0);
  }

  protected async prepare(): Promise<void> {
    let query = tryber.tables.WpAppqLang.do().select([
      tryber.ref("display_name").as("name"),
      "id",
    ]);

    const rows = await query;
    if (!rows.length) {
      return this.setError(404, new OpenapiError("No  languages found"));
    }

    this.setSuccess(200, await query);
  }
}
