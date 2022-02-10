import * as db from "@src/features/db";

export default async (payment: Payment) => {
  if (payment.error) {
    try {
      const sql = db.format(
        `UPDATE wp_appq_payment_request
                SET error_message = ?
                WHERE id = ?;     
                `,
        [JSON.stringify(payment.error.message || payment.error), payment.id]
      );
      await db.query(sql);
      return;
    } catch (error) {
      throw error;
    }
  }
  try {
    const sql = db.format(
      `UPDATE wp_appq_payment_request
              SET is_paid = 1, amount_paypal_fee = ?, paid_date = NOW(), error_message = NULL
              WHERE id = ?;     
              `,
      [payment.fee || "0", payment.id]
    );
    await db.query(sql);
  } catch (error) {
    throw error;
  }
  try {
    const sql = db.format(
      `UPDATE wp_appq_payment
              SET is_paid = 1
              WHERE request_id = ?;     
              `,
      [payment.id]
    );
    await db.query(sql);
  } catch (error) {
    throw error;
  }

  try {
    const sql = db.format(
      `UPDATE wp_appq_evd_profile
            SET pending_booty = pending_booty - ?, booty = booty + ?,payment_status = 0
            WHERE id = ?;     
            `,
      [payment.amount, payment.amount, payment.tester_id]
    );
    await db.query(sql);
  } catch (error) {
    throw error;
  }
};
