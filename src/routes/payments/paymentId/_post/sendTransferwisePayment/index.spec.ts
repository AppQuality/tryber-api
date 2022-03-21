import Transferwise from "@src/features/tranferwise";

import sendTransferwisePayment from ".";

const paymentMockData: Payment = {
  id: 1,
  tester_id: 1,
  accountName: "John Doe",
  type: "paypal",
  status: "pending",
  testerEmail: "john.doe@example.com",
  coordinates: "DE12345678901234567890",
  testerEmail: "jhon.doe@example.com",
  amount: 1,
};
jest.mock("@src/features/tranferwise");

const mockFee = 0.35;

describe("Send transferwise payment", () => {
  it("Should return fee and update status as paid on success", async () => {
    (Transferwise.prototype.createPayment as jest.Mock).mockImplementation(
      () => ({
        quote: {
          paymentOptions: {
            fee: { total: mockFee },
          },
        },
      })
    );

    const data = await sendTransferwisePayment(paymentMockData);
    expect(data).toMatchObject({
      ...paymentMockData,
      status: "paid",
      fee: mockFee,
    });
  });
  it("Should throw error on error", async () => {
    (Transferwise.prototype.createPayment as jest.Mock).mockImplementation(
      () => {
        throw new Error("Transferwise error");
      }
    );

    try {
      const data = await sendTransferwisePayment(paymentMockData);
      fail("Should throw error");
    } catch (error) {
      expect((error as OpenapiError).message).toBe("Transferwise error");
    }
  });
});
