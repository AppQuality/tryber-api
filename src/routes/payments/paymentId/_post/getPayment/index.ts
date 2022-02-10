import * as db from "@src/features/db";

export default async (paymentId: number): Promise<Payment> => {
  const sql = db.format(
    `SELECT req.id, p.id as tester_id, p.name , p.surname, req.amount, req.iban, req.paypal_email, req.is_paid
    FROM wp_appq_payment_request req
    JOIN wp_appq_evd_profile p ON (p.id = req.tester_id)
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

  return {
    id: payment.id,
    tester_id: payment.tester_id,
    accountName: `${payment.name} ${payment.surname}`,
    amount: payment.amount,
    type: paymentType,
    coordinates,
    status: payment.is_paid == "1" ? "paid" : "pending",
  };
};
