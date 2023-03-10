/** OPENAPI-CLASS: get-education */
import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";
import OpenapiError from "@src/features/OpenapiError";

export default class Route extends UserRoute<{
  response: StoplightOperations["get-education"]["responses"]["200"]["content"]["application/json"];
}> {
  constructor(configuration: RouteClassConfiguration) {
    super({ ...configuration, element: "education" });
    this.setId(0);
  }

  protected async prepare(): Promise<void> {
    let query = tryber.tables.WpAppqEducation.do().select([
      tryber.ref("display_name").as("name"),
      "id",
    ]);

    const rows = await query;
    if (!rows.length) {
      return this.setError(404, new OpenapiError("No education found"));
    }

    this.setSuccess(200, await query);
  }
}
