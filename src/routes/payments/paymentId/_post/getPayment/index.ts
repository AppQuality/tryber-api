import * as db from "@src/features/db";

export default async (paymentId: number): Promise<Payment> => {
  const sql = db.format(
    `SELECT 
      req.id, req.amount, req.iban, req.paypal_email, req.is_paid, req.error_message as error_message,
      p.id as tester_id, p.name , p.surname,p.email as tester_email,
      f.fiscal_category
    FROM wp_appq_payment_request req
    JOIN wp_appq_evd_profile p ON (p.id = req.tester_id)
    JOIN wp_appq_fiscal_profile f ON (f.id = req.fiscal_profile_id)
    WHERE req.id = ?;
    `,
    [paymentId]
  );
  let payment;
  try {
    payment = await db.query(sql);
    if (!payment.length) throw Error("No payment found");
    payment = payment[0];
  } catch (error) {
    throw error;
  }
  let paymentType: Payment["type"], coordinates;
  if (payment.iban) {
    paymentType = "transferwise";
    coordinates = payment.iban;
  } else if (payment.paypal_email) {
    paymentType = "paypal";
    coordinates = payment.paypal_email;
  } else {
    throw Error("Invalid payment type");
  }

  let paymentErrorCode: string | undefined;

  if (payment.error_message) {
    try {
      const error_obj = JSON.parse(payment.error_message);
      paymentErrorCode = error_obj.code;
    } catch (e) {
      paymentErrorCode = "GENERIC_ERROR";
    }
  }

  return {
    id: payment.id,
    tester_id: payment.tester_id,
    accountName: `${payment.name} ${payment.surname}`,
    amount: payment.amount,
    type: paymentType,
    coordinates,
    testerEmail: payment.tester_email,
    fiscalCategory: payment.fiscal_category,
    status: payment.is_paid == "1" ? "paid" : "pending",
    currentErrorCode: paymentErrorCode,
  };
};
