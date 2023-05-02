/** OPENAPI-ROUTE: post-users-me-payments */

import * as db from "@src/features/db";
import debugMessage from "@src/features/debugMessage";
import { sendTemplate } from "@src/features/mail/sendTemplate";
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

  const fiscalData = {
    tax_percent: 0,
    gross: booty,
    witholding: 0,
  };
  if (fiscalProfile.fiscal_category === 1) {
    fiscalData.tax_percent = 20;
    fiscalData.gross = Math.round((booty + Number.EPSILON) * 125) / 100;
    fiscalData.witholding = Math.round((booty + Number.EPSILON) * 25) / 100;
  }

  let paypalEmail = null;
  let iban = null;
  let accountHolderName = null;
  if (body.method.type === "paypal") {
    paypalEmail = body.method.email;
  } else if (body.method.type === "iban") {
    iban = body.method.iban;
    accountHolderName = body.method.accountHolderName;
  }

  const isStampRequired = fiscalData.gross > 77.47;
  const data = await db.query(
    db.format(
      `
    INSERT INTO wp_appq_payment_request 
    (
      tester_id, amount, is_paid, fiscal_profile_id,amount_gross, 
      amount_withholding,paypal_email, stamp_required,withholding_tax_percentage,
      iban, account_holder_name
    )
    VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
      [
        req.user.testerId,
        booty,
        fiscalProfile.id,
        fiscalData.gross,
        fiscalData.witholding,
        paypalEmail,
        isStampRequired,
        fiscalData.tax_percent,
        iban,
        accountHolderName,
      ]
    )
  );
  const requestId = data.insertId;

  await db.query(
    db.format(
      `
    UPDATE wp_appq_payment 
      SET is_requested = 1, request_id = ?
    WHERE tester_id = ? AND is_requested = 0
  `,
      [requestId, req.user.testerId]
    )
  );

  try {
    if (process.env.PAYMENT_REQUESTED_EMAIL) {
      const sql = `SELECT name,email FROM wp_appq_evd_profile WHERE id = ?`;
      const tester: [{ name: string; email: string }] = await db.query(
        db.format(sql, [req.user.testerId])
      );
      const now = new Date();

      await sendTemplate({
        email: tester[0].email,
        subject: "[Tryber] Payout Request",
        template: process.env.PAYMENT_REQUESTED_EMAIL,
        optionalFields: {
          "{Profile.name}": tester[0].name,
          "{Payment.amount}": booty,
          "{Payment.requestDate}": now.toLocaleString("it", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }),
          "{Payment.methodLabel}":
            body.method.type === "paypal" ? "PayPal Email" : "IBAN",
          "{Payment.method}":
            body.method.type === "paypal"
              ? body.method.email
              : body.method.iban,
        },
      });
    }
  } catch (err) {
    debugMessage(err);
  }

  res.status_code = 200;
  return {
    id: data.insertId,
  };
};
