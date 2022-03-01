import Paypal from "@src/features/paypal";

import sendPaypalPayment from ".";

const paymentMockData: Payment = {
  id: 1,
  tester_id: 1,
  accountName: "John Doe",
  type: "paypal",
  status: "pending",
  coordinates: "john.doe@example.com",
  amount: 1,
};
jest.mock("@src/features/paypal");

const mockFee = 0.35;

describe("Send paypal payment", () => {
  it("Should return fee and update status as paid on success", async () => {
    (Paypal.prototype.createPayment as jest.Mock).mockImplementation(() => ({
      fee: mockFee,
    }));

    const data = await sendPaypalPayment(paymentMockData);
    expect(data).toMatchObject({
      ...paymentMockData,
      status: "paid",
      fee: mockFee,
    });
  });
  it("Should throw error on error", async () => {
    (Paypal.prototype.createPayment as jest.Mock).mockImplementation(() => {
      throw new Error("Paypal error");
    });

    try {
      const data = await sendPaypalPayment(paymentMockData);
      fail("Should throw error");
    } catch (error) {
      expect((error as OpenapiError).message).toBe("Paypal error");
    }
  });
});
