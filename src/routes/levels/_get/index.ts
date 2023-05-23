/** OPENAPI-CLASS: get-levels */

import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";
import OpenapiError from "@src/features/OpenapiError";

export default class Route extends UserRoute<{
  response: StoplightOperations["get-levels"]["responses"]["200"]["content"]["application/json"];
}> {
  protected async prepare(): Promise<void> {
    const rows = await tryber.tables.WpAppqActivityLevelDefinition.do().select([
      "id",
      "name",
      tryber.ref("reach_exp_pts").as("reach"),
      tryber.ref("hold_exp_pts").as("hold"),
    ]);

    if (!rows.length) {
      return this.setError(404, new OpenapiError("No levels found"));
    }

    this.setSuccess(
      200,
      rows.map((level) => {
        return {
          id: level.id,
          name: level.name,
          reach: level.reach ?? undefined,
          hold: level.hold ?? undefined,
        };
      })
    );
  }
}
