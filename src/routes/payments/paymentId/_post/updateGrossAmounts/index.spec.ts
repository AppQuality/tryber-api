import sqlite3 from "@src/features/sqlite";
import { data as paymentRequestData } from "@src/__mocks__/mockedDb/paymentRequest";
import updateGrossAmounts from ".";

jest.mock("@src/features/db");

const payment = {
  id: 1,
  amount: 100,
  amount_gross: 0,
  amount_withholding: 0,
  withholding_tax_percentage: 0,
  stamp_required: 0,
};
const paymentNoStampRequired = {
  id: 2,
  amount: 59,
  amount_gross: 0,
  amount_withholding: 0,
  withholding_tax_percentage: 0,
  stamp_required: 0,
};
describe("Update gross amount", () => {
  beforeEach(() => {
    return new Promise(async (resolve) => {
      await sqlite3.insert("wp_appq_payment_request", payment);
      await sqlite3.insert("wp_appq_payment_request", paymentNoStampRequired);
      resolve(null);
    });
  });
  afterEach(() => {
    return new Promise(async (resolve) => {
      await paymentRequestData.drop();
      resolve(null);
    });
  });

  it("Should update gross amount with 125% of amount if fiscal profile is 1", async () => {
    await updateGrossAmounts(
      {
        id: payment.id,
        amount: payment.amount,
      },
      1
    );
    const updatedPayment = await sqlite3.get(
      `SELECT * FROM wp_appq_payment_request WHERE id = ${payment.id}`
    );
    expect(updatedPayment.amount_gross).toBe(125);
  });

  it("Should update gross amount with 100% of amount if fiscal profile isn't 1", async () => {
    await updateGrossAmounts(
      {
        id: payment.id,
        amount: payment.amount,
      },
      2
    );
    const updatedPayment = await sqlite3.get(
      `SELECT * FROM wp_appq_payment_request WHERE id = ${payment.id}`
    );
    expect(updatedPayment.amount_gross).toBe(100);
  });

  it("Should update withholding amount to 20% of gross amount if fiscal profile is 1", async () => {
    await updateGrossAmounts(
      {
        id: payment.id,
        amount: payment.amount,
      },
      1
    );
    const updatedPayment = await sqlite3.get(
      `SELECT * FROM wp_appq_payment_request WHERE id = ${payment.id}`
    );
    expect(updatedPayment.amount_withholding).toBe(25);
  });
  it("Should update withholding amount to 0 if fiscal profile isn't 1", async () => {
    await updateGrossAmounts(
      {
        id: payment.id,
        amount: payment.amount,
      },
      2
    );
    const updatedPayment = await sqlite3.get(
      `SELECT * FROM wp_appq_payment_request WHERE id = ${payment.id}`
    );
    expect(updatedPayment.amount_withholding).toBe(0);
  });

  it("Should set stamp required only if gross is more than 77.47", async () => {
    await updateGrossAmounts(
      {
        id: payment.id,
        amount: payment.amount,
      },
      1
    );
    const updatedPayment = await sqlite3.get(
      `SELECT * FROM wp_appq_payment_request WHERE id = ${payment.id}`
    );
    expect(updatedPayment.stamp_required).toBe(1);
    await updateGrossAmounts(
      {
        id: paymentNoStampRequired.id,
        amount: paymentNoStampRequired.amount,
      },
      1
    );
    const updatedPaymentNoStampRequired = await sqlite3.get(
      `SELECT * FROM wp_appq_payment_request WHERE id = ${paymentNoStampRequired.id}`
    );
    expect(updatedPaymentNoStampRequired.stamp_required).toBe(0);
  });

  it("Should update witholding percentage to 20 if fiscal profile is 1", async () => {
    await updateGrossAmounts(
      {
        id: payment.id,
        amount: payment.amount,
      },
      1
    );
    const updatedPayment = await sqlite3.get(
      `SELECT * FROM wp_appq_payment_request WHERE id = ${payment.id}`
    );
    expect(updatedPayment.withholding_tax_percentage).toBe(20);
  });
  it("Should update witholding percentage to 0 if fiscal profile isn't 1", async () => {
    await updateGrossAmounts(
      {
        id: payment.id,
        amount: payment.amount,
      },
      2
    );
    const updatedPayment = await sqlite3.get(
      `SELECT * FROM wp_appq_payment_request WHERE id = ${payment.id}`
    );
    expect(updatedPayment.withholding_tax_percentage).toBe(0);
  });
});
