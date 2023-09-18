import { tryber } from "@src/features/database";

export default async (paymentId: number): Promise<Payment> => {
  const r = tryber.tables.WpAppqPaymentRequest.do()
    .select(tryber.ref("id").withSchema("wp_appq_payment_request").as("id"))
    .select(
      tryber.ref("amount").withSchema("wp_appq_payment_request").as("amount")
    )
    .select(tryber.ref("iban").withSchema("wp_appq_payment_request").as("iban"))
    .select(
      tryber
        .ref("paypal_email")
        .withSchema("wp_appq_payment_request")
        .as("paypal_email")
    )
    .select(
      tryber.ref("is_paid").withSchema("wp_appq_payment_request").as("is_paid")
    )
    .select(
      tryber
        .ref("error_message")
        .withSchema("wp_appq_payment_request")
        .as("error_message")
    )
    .select(
      tryber
        .ref("account_holder_name")
        .withSchema("wp_appq_payment_request")
        .as("account_holder_name")
    )
    .select(tryber.ref("id").withSchema("wp_appq_evd_profile").as("tester_id"))
    .select(
      tryber.ref("name").withSchema("wp_appq_evd_profile").as("tester_name")
    )
    .select(
      tryber
        .ref("surname")
        .withSchema("wp_appq_evd_profile")
        .as("tester_surname")
    )
    .select(
      tryber.ref("email").withSchema("wp_appq_evd_profile").as("tester_email")
    )
    .select(
      tryber
        .ref("fiscal_category")
        .withSchema("wp_appq_fiscal_profile")
        .as("fiscal_category")
    )
    .join(
      "wp_appq_evd_profile",
      "wp_appq_payment_request.tester_id",
      "wp_appq_evd_profile.id"
    )
    .join(
      "wp_appq_fiscal_profile",
      "wp_appq_payment_request.fiscal_profile_id",
      "wp_appq_fiscal_profile.id"
    )
    .select()
    .where("wp_appq_payment_request.id", paymentId);

  let payment;
  try {
    payment = (await r).map((row) => {
      const { account_holder_name, ...rest } = row;
      return {
        ...rest,
        account_name: account_holder_name
          ? account_holder_name
          : `${rest.tester_name} ${rest.tester_surname}`,
      };
    });
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
    accountName: payment.account_name,
    amount: payment.amount,
    type: paymentType,
    coordinates,
    testerEmail: payment.tester_email,
    fiscalCategory: payment.fiscal_category,
    status: payment.is_paid == 1 ? "paid" : "pending",
    currentErrorCode: paymentErrorCode,
  };
};
