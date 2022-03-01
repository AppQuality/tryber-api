import axios from "axios";

import Paypal from ".";

jest.mock("axios");
const clientId = "";
const secret = "";
const sandbox = false;

const amount = 100;
const fee = 0.35;
const receiver = "john.doe@example.com";

const validTokenPromise = () =>
  Promise.resolve({
    status: 200,
    data: {
      access_token: "access_token",
      expires_in: 3600,
    },
  });
const validPaymentPromise = () =>
  Promise.resolve({
    status: 200,
    data: {
      links: [
        {
          href: "singlePayout",
        },
      ],
    },
  });
const noFundsPaymentPromise = () =>
  Promise.reject({
    response: {
      status: 422,
      data: {
        name: "INSUFFICIENT_FUNDS",
        message: "Insufficient funds",
      },
    },
  });
const validSinglePayoutPromise = () =>
  Promise.resolve({
    status: 200,
    data: {
      batch_header: {
        batch_status: "SUCCESS",
      },
      items: [
        {
          transaction_status: "SUCCESS",
          payout_item: {
            amount: {
              currency: "EUR",
              value: amount,
            },
            receiver: receiver,
          },

          payout_item_fee: {
            currency: "EUR",
            value: fee,
          },
        },
      ],
    },
  });
const receiverUnregisteredPaymentPromise = () =>
  Promise.resolve({
    status: 200,
    data: {
      batch_header: {
        batch_status: "SUCCESS",
      },
      items: [
        {
          transaction_status: "FAILURE",
          payout_item: {
            amount: {
              currency: "EUR",
              value: amount,
            },
            receiver: receiver,
          },
          errors: {
            name: "RECEIVER_UNREGISTERED",
            message: "Receiver is not registered",
          },
        },
      ],
    },
  });
describe("Paypal class", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it("should be instantiable", () => {
    expect(
      new Paypal({
        clientId,
        secret,
        sandbox,
      })
    ).toBeDefined();
  });

  it("Should return a valid payment on success", async () => {
    const paypal = new Paypal({
      clientId,
      secret,
      sandbox,
    });
    //@ts-ignore
    axios.mockImplementation((data) => {
      if (data.url.includes("/v1/oauth2/token") && data.method === "POST") {
        return validTokenPromise();
      }
      if (data.url.includes("/v1/payments/payouts") && data.method === "POST") {
        return validPaymentPromise();
      }
      if (data.url.includes("singlePayout") && data.method === "GET") {
        return validSinglePayoutPromise();
      }
      return jest.fn();
    });

    try {
      const res = await paypal.createPayment({
        amount,
        email: receiver,
        reason: "Test",
      });
      expect(res).toMatchObject({
        amount,
        fee,
        receiver,
      });
    } catch (err) {
      throw err;
    }
  });

  it("Should throw an openapi error with code 422 on receiver unregistered", async () => {
    const paypal = new Paypal({
      clientId,
      secret,
      sandbox,
    });
    //@ts-ignore
    axios.mockImplementation((data) => {
      if (data.url.includes("/v1/oauth2/token") && data.method === "POST") {
        return validTokenPromise();
      }
      if (data.url.includes("/v1/payments/payouts") && data.method === "POST") {
        return validPaymentPromise();
      }
      if (data.url.includes("singlePayout") && data.method === "GET") {
        return receiverUnregisteredPaymentPromise();
      }
      return jest.fn();
    });

    try {
      await paypal.createPayment({
        amount,
        email: receiver,
        reason: "Test",
      });
    } catch (err) {
      expect(err).toMatchObject({
        message: {
          code: "RECEIVER_UNREGISTERED",
          data: `${receiver} : Receiver is not registered`,
        },
        status_code: 422,
      });
    }
  });
  it("Should throw an openapi error with code 422 on insufficient funds", async () => {
    const paypal = new Paypal({
      clientId,
      secret,
      sandbox,
    });
    //@ts-ignore
    axios.mockImplementation((data) => {
      if (data.url.includes("/v1/oauth2/token") && data.method === "POST") {
        return validTokenPromise();
      }
      if (data.url.includes("/v1/payments/payouts") && data.method === "POST") {
        return noFundsPaymentPromise();
      }
      if (data.url.includes("singlePayout") && data.method === "GET") {
        return validPaymentPromise();
      }
      return jest.fn();
    });

    try {
      await paypal.createPayment({
        amount,
        email: receiver,
        reason: "Test",
      });
    } catch (err) {
      expect(err).toMatchObject({
        message: {
          code: "INSUFFICIENT_FUNDS",
          data: `Amount: ${amount}€ | Insufficient funds`,
        },
        status_code: 422,
      });
    }
  });
});
