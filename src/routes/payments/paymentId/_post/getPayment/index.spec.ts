import * as db from "@src/features/db";
import getPayment from ".";

jest.mock("@src/features/db");

const mockPaymentData = {
  id: "1",
  tester_id: 2,
  name: "John",
  surname: "Doe",
  amount: 100,
};

describe("Get Payments", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it('Should throw "No payment found" error on no results', async () => {
    try {
      (db.query as jest.Mock).mockResolvedValue([]);
      const payment = await getPayment(1);
      fail("Should throw error");
    } catch (error) {
      expect((error as OpenapiError).message).toBe("No payment found");
    }
  });
  it('Should throw "Invalid payment type" error if no paypal email and no iban', async () => {
    try {
      (db.query as jest.Mock).mockResolvedValue([
        {
          ...mockPaymentData,
        },
      ]);
      const payment = await getPayment(1);
      fail("Should throw error");
    } catch (error) {
      expect((error as OpenapiError).message).toBe("Invalid payment type");
    }
  });
  it("Should return a transferwise payment object if iban is present", async () => {
    try {
      const paymentData: Payment = {
        id: mockPaymentData.id,
        tester_id: mockPaymentData.tester_id,
        accountName: `${mockPaymentData.name} ${mockPaymentData.surname}`,
        amount: mockPaymentData.amount,
        type: "transferwise",
        coordinates: "IT1234567890123456789012",
        status: "pending",
      };
      (db.query as jest.Mock).mockResolvedValue([
        { ...mockPaymentData, iban: "IT1234567890123456789012" },
      ]);
      const payment = await getPayment(1);
      expect(JSON.stringify(payment)).toBe(JSON.stringify(paymentData));
    } catch (error) {
      throw error;
    }
  });
  it("Should return a paypal payment object if iban is present", async () => {
    try {
      const paymentData: Payment = {
        id: mockPaymentData.id,
        tester_id: mockPaymentData.tester_id,
        accountName: `${mockPaymentData.name} ${mockPaymentData.surname}`,
        amount: mockPaymentData.amount,
        type: "paypal",
        coordinates: "john.doe@example.com",
        status: "pending",
      };
      (db.query as jest.Mock).mockResolvedValue([
        { ...mockPaymentData, paypal_email: "john.doe@example.com" },
      ]);
      const payment = await getPayment(1);
      expect(JSON.stringify(payment)).toBe(JSON.stringify(paymentData));
    } catch (error) {
      throw error;
    }
  });
});
