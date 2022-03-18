/** OPENAPI-ROUTE: post-users-me-payments */
import * as db from "@src/features/db";
import { Context } from "openapi-backend";

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  const currentBooty = await db.query(
    db.format(
      `
  SELECT pending_booty 
  FROM wp_appq_evd_profile
  WHERE id = ?`,
      [req.user.testerId]
    )
  );
  if (currentBooty.length === 0 || currentBooty[0].pending_booty === 0) {
    res.status_code = 403;
    return {
      error: "You don't have any booty to pay",
    };
  }
};
