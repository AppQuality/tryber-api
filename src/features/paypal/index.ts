import axios, { AxiosError } from "axios";

class Paypal {
  clientId: string;
  secret: string;
  baseUrl: string;

  token?: string;
  tokenExpire?: string;

  constructor({
    clientId,
    secret,
    sandbox = false,
  }: {
    clientId: string;
    secret: string;
    sandbox?: boolean;
  }) {
    this.secret = secret;
    this.clientId = clientId;
    this.baseUrl = sandbox
      ? "https://api-m.sandbox.paypal.com"
      : "https://api.paypal.com";
  }

  private async getToken() {
    if (
      this.token &&
      this.tokenExpire &&
      new Date(this.tokenExpire) > new Date()
    ) {
      return this.token;
    }

    const res = await axios({
      method: "POST",
      url: `${this.baseUrl}/v1/oauth2/token`,
      auth: {
        username: this.clientId,
        password: this.secret,
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: "grant_type=client_credentials",
    });

    if (res.status == 200) {
      this.token = res.data.access_token;
      this.tokenExpire = new Date(
        new Date().getTime() + res.data.expires_in * 1000
      ).toISOString();
      return this.token;
    }
    throw new Error(res.data.response);
  }

  public async createPayment({
    amount,
    email,
    reason,
  }: {
    amount: number;
    email: string;
    reason: string;
  }) {
    let token;
    try {
      token = await this.getToken();
    } catch (error) {
      throw error;
    }

    let res;
    try {
      res = await axios({
        method: "POST",
        url: `${this.baseUrl}/v1/payments/payouts`,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        data: {
          sender_batch_header: {
            sender_batch_id: `Payouts_${new Date().getTime()}`,
            email_subject: "You have a payout!",
            email_message:
              "You have received a payout! Thanks for using our service!",
          },
          items: [
            {
              recipient_type: "EMAIL",
              amount: {
                value: amount,
                currency: "EUR",
              },
              note: reason,
              receiver: email,
              notification_language: "en-GB",
            },
          ],
        },
      });
    } catch (error) {
      const res = error as AxiosError;
      console.log(res.response?.data);

      if (res.response?.data) {
        if (res.response?.data?.name == "INSUFFICIENT_FUNDS") {
          throw {
            status_code: 422,
            message: {
              code: "INSUFFICIENT_FUNDS",
              data: `Amount: ${amount}€ | ${res.response?.data?.message}`,
            },
          };
        }
      }
      throw {
        status_code: 400,
        message: {
          code: "GENERIC_ERROR",
          data: JSON.stringify(res.response?.data),
        },
      };
    }

    try {
      const batch = res.data.links.pop();

      const status = await this.waitForCompletion(batch.href);

      const payment = status.items.pop();

      if (payment.transaction_status == "SUCCESS") {
        return {
          amount: payment.payout_item.amount.value,
          fee: payment.payout_item_fee.value,
          receiver: payment.payout_item.receiver,
        };
      }

      if (payment.errors) {
        if (payment.errors.name == "RECEIVER_UNREGISTERED") {
          throw {
            status_code: 422,
            message: {
              code: "RECEIVER_UNREGISTERED",
              data: `${payment.payout_item.receiver} : ${payment.errors.message}`,
            },
          };
        }
      }
      throw {
        status_code: 400,
        message: {
          code: "GENERIC_ERROR",
          data: JSON.stringify(payment.errors ? payment.errors : payment),
        },
      };
    } catch (error) {
      throw error;
    }
  }

  private async waitForCompletion(requestUrl: string) {
    let token;
    try {
      token = await this.getToken();
    } catch (error) {
      throw error;
    }
    try {
      const res = await axios({
        method: "GET",
        url: `${requestUrl}`,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (res.data.batch_header.batch_status == "SUCCESS") {
        return res.data;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
      return this.waitForCompletion(requestUrl);
    } catch (error) {
      throw error;
    }
  }
}

export default Paypal;
