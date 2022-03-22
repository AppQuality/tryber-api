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
  const body =
    req.body as StoplightOperations["post-users-me-payments"]["requestBody"]["content"]["application/json"];
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

  const gross =
    fiscalProfile.fiscal_category === 1
      ? Math.round((booty + Number.EPSILON) * 125) / 100
      : booty;
  const witholding =
    fiscalProfile.fiscal_category === 1
      ? Math.round((booty + Number.EPSILON) * 25) / 100
      : 0;

  let paypalEmail = null;
  if (body.method.type === "paypal") {
    paypalEmail = body.method.email;
  }

  const isStampRequired = gross > 77.47;
  const data = await db.query(
    db.format(
      `
    INSERT INTO wp_appq_payment_request 
    (tester_id, amount, is_paid, fiscal_profile_id,amount_gross, amount_withholding,paypal_email, stamp_required)
    VALUES (?, ?, 0, ?, ?, ?, ?, ?)
  `,
      [
        req.user.testerId,
        booty,
        fiscalProfile.id,
        gross,
        witholding,
        paypalEmail,
        isStampRequired,
      ]
    )
  );

  res.status_code = 200;
  return {
    id: data.insertId,
  };
};
