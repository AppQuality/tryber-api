import axios, { AxiosError, AxiosResponse } from "axios";
import dotenv from "dotenv";

dotenv.config();

class Paypal {
  clientId: string;
  secret: string;
  sandbox: boolean;
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
    this.sandbox = sandbox;
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
      throw {
        status_code: 422,
        message: {
          code: "GENERIC_ERROR",
          data: `API not configured - Please contact an administrator`,
        },
      };
    }

    let res;
    try {
      let reasonText =
        process.env.ALLOW_DUPLICATED_PAYMENTS_IN_SANDBOX && this.sandbox
          ? `${Math.floor(Date.now() / 1000)} Test no.${reason}`
          : reason;
      res = await axios({
        method: "POST",
        url: `${this.baseUrl}/v1/payments/payouts`,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        data: {
          sender_batch_header: {
            sender_batch_id: reasonText,
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
          await this.cancelPayment(payment.payout_item_id);
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

  private cancelPayment(payout_item_id: string) {
    return axios({
      method: "POST",
      url: `${this.baseUrl}/v1/payments/payouts-item/${payout_item_id}/cancel`,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
    });
  }

  private async waitForCompletion(
    requestUrl: string,
    retries = 10
  ): Promise<AxiosResponse["data"]> {
    let token;
    if (retries === 0) throw Error("Max retries reached");
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
      return this.waitForCompletion(requestUrl, retries - 1);
    } catch (error) {
      throw error;
    }
  }
}

export default Paypal;
