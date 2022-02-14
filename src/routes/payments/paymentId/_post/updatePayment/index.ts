import * as db from "@src/features/db";

export default async (payment: Payment) => {
  if (payment.error) {
    try {
      let errorMessage;
      if (payment.error.message) {
        if (typeof payment.error.message === "string") {
          errorMessage = payment.error.message;
        } else {
          errorMessage = JSON.stringify(payment.error.message);
        }
      } else {
        errorMessage = JSON.stringify(payment.error);
      }
      const sql = db.format(
        `UPDATE wp_appq_payment_request
                SET error_message = ?
                WHERE id = ?;     
                `,
        [errorMessage, payment.id]
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
