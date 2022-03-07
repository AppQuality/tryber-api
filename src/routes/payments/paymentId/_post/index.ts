import { Context } from "openapi-backend";

import generateReceipt from "./generateReceipt";
import getPayment from "./getPayment";
import sendPaypalPayment from "./sendPaypalPayment";
import sendTransferwisePayment from "./sendTransferwisePayment";
import updatePayment from "./updatePayment";

/** OPENAPI-ROUTE: post-payments-paymentId */
export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  if (!req.user?.permission?.admin?.appq_prospect) {
    res.status_code = 403;
    return {
      element: "payments",
      id: 0,
      message: "You cannot send payments",
    };
  }

  let payment, paymentId;
  try {
    paymentId = c.request.params.paymentId;
    if (typeof paymentId !== "string")
      throw Error("Invalid payment query parameter");

    paymentId = parseInt(paymentId);
    payment = await getPayment(paymentId);
    if (!payment) throw Error("No payment found");
  } catch (error) {
    if (process.env && process.env.DEBUG) {
      console.error(error);
    }

    res.status_code = 404;
    return {
      element: "payments",
      id: paymentId,
      message: (error as OpenapiError).message,
    };
  }

  if (payment.status !== "pending") {
    res.status_code = 400;
    return {
      element: "payments",
      id: paymentId,
      message: {
        code: "GENERIC_ERROR",
        data: "Payment is not pending",
      },
    };
  }

  try {
    if (payment.type == "paypal") {
      payment = await sendPaypalPayment(payment);
    } else if (payment.type == "transferwise") {
      payment = await sendTransferwisePayment(payment);
    } else {
      throw { status_code: 400, message: "Invalid payment type" };
    }
  } catch (error) {
    let res = error as OpenapiError;
    payment.error = res;
  }

  try {
    await updatePayment(payment);
  } catch (error) {
    if (process.env && process.env.DEBUG) {
      console.error(error);
    }
    res.status_code = (error as OpenapiError).status_code || 502;
    return {
      element: "payments",
      id: paymentId,
      message: (error as OpenapiError).message,
    };
  }

  if (payment.error) {
    if (process.env && process.env.DEBUG) {
      console.error(payment.error);
    }
    res.status_code = payment.error.status_code || 400;
    return {
      element: "payments",
      id: paymentId,
      message: payment.error.message,
    };
  }

  generateReceipt(paymentId);
  res.status_code = 200;

  return payment;
};
