import { data as paymentRequestData } from "@src/__mocks__/mockedDb/paymentRequest";
import Profile from "@src/__mocks__/mockedDb/profile";
import sqlite3 from "@src/features/sqlite";
import getPayment from ".";

const tester = {
  id: 1,
  name: "John",
  surname: "Doe",
  email: "tester@example.com",
};
const validBankTransferPayment = {
  id: 1,
  tester_id: tester.id,
  amount: 100,
  iban: "DE12345678901234567890",
  is_paid: 0,
  fiscal_profile_id: 1,
  account_holder_name: "John Doe",
  under_threshold: 0,
  withholding_tax_percentage: 20,
};
const validPaypalPayment = {
  id: 2,
  tester_id: tester.id,
  amount: 100,
  paypal_email: "john.doe@example.com",
  is_paid: 0,
  fiscal_profile_id: 1,
  under_threshold: 0,
  withholding_tax_percentage: 20,
};

const invalidTypePayment = {
  id: 3,
  tester_id: tester.id,
  amount: 100,
  is_paid: 0,
  fiscal_profile_id: 1,
  under_threshold: 0,
  withholding_tax_percentage: 20,
};

const fiscalProfile = {
  id: 1,
  fiscal_category: 1,
  tester_id: 1,
  name: "",
  surname: "",
  sex: 1,
  birth_date: "",
};

describe("POST /payments/:paymentId", () => {
  beforeAll(() => {
    return new Promise(async (resolve) => {
      await sqlite3.insert("wp_appq_payment_request", validBankTransferPayment);
      await sqlite3.insert("wp_appq_payment_request", validPaypalPayment);
      await sqlite3.insert("wp_appq_payment_request", invalidTypePayment);
      await sqlite3.insert("wp_appq_fiscal_profile", fiscalProfile);

      Profile.insert(tester);

      resolve(null);
    });
  });
  afterAll(async () => {
    await paymentRequestData.drop();
    await Profile.clear();
  });
  it('Should throw "No payment found" error on no results', async () => {
    try {
      await getPayment(100);
      fail("Should throw error");
    } catch (error) {
      expect((error as OpenapiError).message).toBe("No payment found");
    }
  });
  it('Should throw "Invalid payment type" error if no paypal email and no iban', async () => {
    try {
      await getPayment(3);
      fail("Should throw error");
    } catch (error) {
      expect((error as OpenapiError).message).toBe("Invalid payment type");
    }
  });
  it("Should return a transferwise payment object if iban is present", async () => {
    try {
      const payment = await getPayment(validBankTransferPayment.id);
      expect(payment).toMatchObject({
        id: validBankTransferPayment.id,
        tester_id: tester.id,
        accountName: validBankTransferPayment.account_holder_name,
        amount: validBankTransferPayment.amount,
        type: "transferwise",
        coordinates: validBankTransferPayment.iban,
        testerEmail: tester.email,
        status: "pending",
      });
    } catch (error) {
      throw error;
    }
  });
  it("Should return a paypal payment object if paypal email is present", async () => {
    try {
      const payment = await getPayment(validPaypalPayment.id);
      expect(payment).toMatchObject({
        id: validPaypalPayment.id,
        tester_id: tester.id,
        accountName: `${tester.name} ${tester.surname}`,
        amount: validPaypalPayment.amount,
        type: "paypal",
        coordinates: validPaypalPayment.paypal_email,
        testerEmail: tester.email,
        status: "pending",
      });
    } catch (error) {
      throw error;
    }
  });
});
