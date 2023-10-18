import { tryber } from "@src/features/database";

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
      await tryber.tables.WpAppqPaymentRequest.do()
        .update({
          error_message: errorMessage,
        })
        .where("id", payment.id);
      return;
    } catch (error) {
      throw error;
    }
  }
  try {
    await tryber.tables.WpAppqPaymentRequest.do()
      .update({
        is_paid: 1,
        amount_paypal_fee: payment.fee || 0,
        paid_date: tryber.fn.now(),
        error_message: undefined,
      })
      .where("id", payment.id);
  } catch (error) {
    throw error;
  }
  try {
    await tryber.tables.WpAppqPayment.do()
      .update({
        is_paid: 1,
      })
      .where("request_id", payment.id);
  } catch (error) {
    throw error;
  }
};
