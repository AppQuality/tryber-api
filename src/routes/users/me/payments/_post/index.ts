/** OPENAPI-ROUTE: post-users-me-payments */
import * as db from "@src/features/db";
import { Context } from "openapi-backend";

import checkBooty from "./checkBooty";
import checkFiscalProfile from "./checkFiscalProfile";
import checkProcessingPayment from "./checkProcessingPayment";

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  let booty, fiscalProfile;
  try {
    booty = await checkBooty(req.user.testerId);
    fiscalProfile = await checkFiscalProfile(req.user.testerId);
    await checkProcessingPayment(req.user.testerId);
  } catch (err) {
    res.status_code = 403;
    return {
      error: (err as OpenapiError).message,
    };
  }

  const data = await db.query(
    db.format(
      `
    INSERT INTO wp_appq_payment_request (tester_id, amount, is_paid, fiscal_profile_id)
    VALUES (?, ?, 0, ?)
  `,
      [req.user.testerId, booty, fiscalProfile]
    )
  );

  res.status_code = 200;
  return {
    id: data.insertId,
  };
};
