/** OPENAPI-ROUTE: get-levels */

import * as db from "@src/features/db";
import debugMessage from "@src/features/debugMessage";
import { Context } from "openapi-backend";

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  try {
    let levels: StoplightOperations["get-levels"]["responses"]["200"]["content"]["application/json"] =
      [];
    levels = await db.query(`
    SELECT id, name, reach_exp_pts AS reach, hold_exp_pts AS hold
    FROM wp_appq_activity_level_definition
    `);
    if (!levels.length) {
      throw Error("No levels");
    }

    res.status_code = 200;
    levels = levels.map((level) => {
      return {
        id: level.id,
        name: level.name,
        reach: level.reach ?? undefined,
        hold: level.hold ?? undefined,
      };
    });
    return levels;
  } catch (err) {
    debugMessage(err);
  }
  res.status_code = 404;
  return {
    element: "levels",
    id: 0,
    message: "No levels found",
  };
};
