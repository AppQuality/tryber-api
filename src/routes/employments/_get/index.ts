/** OPENAPI-CLASS: get-employments */

import OpenapiError from "@src/features/OpenapiError";
import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";

export default class Route extends UserRoute<{
  response: StoplightOperations["get-employments"]["responses"]["200"]["content"]["application/json"];
}> {
  constructor(configuration: RouteClassConfiguration) {
    super({ ...configuration, element: "employments" });
    this.setId(0);
  }

  protected async prepare(): Promise<void> {
    let query = tryber.tables.WpAppqEmployment.do().select(
      "id",
      tryber.ref("display_name").withSchema("wp_appq_employment").as("name")
    );

    const rows = await query;
    if (!rows.length) {
      return this.setError(404, new OpenapiError("No employments found"));
    }

    this.setSuccess(200, await query);
  }
}
