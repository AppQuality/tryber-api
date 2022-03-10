import { AxiosError } from "@googlemaps/google-maps-services-js/node_modules/axios";
import axios from "axios";
import dotenv from "dotenv";

import signRequest from "./signRequest";
import stringToUuid from "./stringToUuid";

dotenv.config();

class Transferwise {
  sandbox: boolean;
  apiKey: string;
  baseUrl: string;

  errorCodes = {
    IBAN_NOT_VALID: "IBAN_NOT_VALID",
    NO_FUNDS: "NO_FUNDS",
    DUPLICATE_PAYMENT: "DUPLICATE_PAYMENT",
    GENERIC_ERROR: "GENERIC_ERROR",
  };

  constructor({
    apiKey,
    sandbox = false,
  }: {
    apiKey: string;
    sandbox?: boolean;
  }) {
    this.apiKey = apiKey;
    this.baseUrl = sandbox
      ? "https://api.sandbox.transferwise.tech"
      : "https://api.transferwise.com";
    this.sandbox = sandbox;
  }

  private async request(
    method: "POST" | "GET",
    url: string,
    data?: { [key: string]: any },
    headers?: { [key: string]: any }
  ) {
    try {
      const res = await axios({
        method,
        url: `${this.baseUrl}${url}`,
        data,
        headers: {
          ...headers,
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (res.status >= 200 && res.status < 300) {
        return res.data;
      }
      throw new Error(res.data.response);
    } catch (error) {
      if ((error as AxiosError).response?.status === 401) {
        throw {
          status_code: 422,
          message: {
            code: "GENERIC_ERROR",
            data: `API not configured - Please contact an administrator`,
          },
        };
      }
      throw error;
    }
  }

  public async createQuote({
    sourceCurrency = "EUR",
    targetCurrency = "EUR",
    sourceAmount,
    targetAmount,
    profile,
    targetAccount,
  }: {
    sourceCurrency?: string;
    targetCurrency?: string;
    sourceAmount?: number;
    targetAmount: number;
    profile: string;
    targetAccount: string;
  }) {
    const data = {
      sourceCurrency,
      targetCurrency,
      sourceAmount,
      targetAmount,
      profile,
      targetAccount,
    };
    try {
      const quote = await this.request("POST", `/v2/quotes`, data);
      quote.paymentOptions = quote.paymentOptions.find(
        ({ payIn }: { payIn: string }) => payIn === "BALANCE"
      );
      return quote;
    } catch (error) {
      throw error;
    }
  }

  public async getProfiles() {
    try {
      return await this.request("GET", `/v1/profiles`);
    } catch (error) {
      throw error;
    }
  }

  public async createRecipient({
    currency = "EUR",
    accountHolderName,
    iban,
  }: {
    currency?: string;
    accountHolderName: string;
    iban: string;
  }) {
    const data = {
      currency,
      type: "iban",
      accountHolderName,
      details: {
        legalType: "PRIVATE",
        IBAN: iban,
      },
    };
    try {
      return await this.request("POST", `/v1/accounts`, data);
    } catch (error) {
      const res = error as AxiosError;
      if (
        res.response?.data?.errors &&
        res.response.data.errors.find(
          (e: { code: string; path: string }) =>
            e.code === "NOT_VALID" && e.path === "IBAN"
        )
      ) {
        throw {
          status_code: res.response?.status,
          message: { code: this.errorCodes.IBAN_NOT_VALID, data: iban },
        };
      }
      throw {
        status_code: res.response?.status,
        message: {
          code: this.errorCodes.GENERIC_ERROR,
          data: JSON.stringify(res.response?.data.errors),
        },
      };
    }
  }

  public async createTransfer({
    targetAccount,
    quoteUuid,
    reason,
  }: {
    targetAccount: string;
    quoteUuid: string;
    reason: string;
  }) {
    const reasonText =
      process.env.ALLOW_DUPLICATED_PAYMENTS_IN_SANDBOX && this.sandbox
        ? `${Math.floor(Date.now() / 1000)} Test no.${reason}`
        : reason;
    const data = {
      targetAccount,
      quoteUuid,
      customerTransactionId: stringToUuid(reasonText),
      details: {
        reference: reasonText,
      },
    };
    try {
      return await this.request("POST", `/v1/transfers`, data);
    } catch (error) {
      const res = error as AxiosError;
      throw {
        status_code: res.response?.status,
        message: JSON.stringify(res.response?.data?.errors || res.message),
      };
    }
  }

  public async fundPayment({
    profileId,
    transferId,
  }: {
    profileId: string;
    transferId: string;
  }): Promise<any> {
    let twoFactorAuthHeader;
    try {
      await this.request(
        "POST",
        `/v3/profiles/${profileId}/transfers/${transferId}/payments`,
        { type: "BALANCE" }
      );
    } catch (error) {
      const res = error as AxiosError;
      if (
        res.response?.status !== 403 ||
        !res.response.headers["x-2fa-approval"]
      ) {
        throw error;
      }
      twoFactorAuthHeader = res.response.headers["x-2fa-approval"];
    }
    if (!twoFactorAuthHeader) throw new Error("No 2FA header");
    const twoFactorAuthCode = await signRequest(twoFactorAuthHeader);

    try {
      return await this.request(
        "POST",
        `/v3/profiles/${profileId}/transfers/${transferId}/payments`,
        { type: "BALANCE" },
        {
          "x-2fa-approval": twoFactorAuthHeader,
          "X-Signature": twoFactorAuthCode,
        }
      );
    } catch (error) {
      const res = error as AxiosError;
      if (
        res.response?.data &&
        res.response.data.type === "BALANCE" &&
        res.response.data.status === "REJECTED"
      ) {
        if (res.response.data.errorCode === "payment.exists") {
          throw {
            status_code: 422,
            message: {
              code: this.errorCodes.DUPLICATE_PAYMENT,
              data: JSON.stringify(res.response.data),
            },
          };
        }
        throw {
          status_code: 422,
          message: {
            code: this.errorCodes.NO_FUNDS,
            data: JSON.stringify(res.response.data),
          },
        };
      }
      throw {
        status_code: res.response?.status,
        message: JSON.stringify(res.response?.data?.errors || res.message),
      };
    }
  }

  public async createPayment({
    targetAmount,
    accountHolderName,
    iban,
    reason,
  }: {
    targetAmount: number;
    accountHolderName: string;
    iban: string;
    reason: string;
  }) {
    const profiles = await this.getProfiles();
    const firstBusinessProfile = profiles.find(
      (profile: { type: "business" | "personal" }) =>
        profile.type === "business"
    );
    if (!firstBusinessProfile) {
      throw new Error("No business profile found");
    }

    let recipient;
    try {
      recipient = await this.createRecipient({
        accountHolderName: accountHolderName.replace(/[^a-zA-Z0-9]+/g, "-"),
        iban,
      });
    } catch (error) {
      const res = error as OpenapiError;
      if ((error as any)?.message?.code) throw error;
      throw {
        status_code: res?.status_code || 400,
        message: { code: this.errorCodes.GENERIC_ERROR, data: res.message },
      };
    }

    let quote;
    try {
      quote = await this.createQuote({
        targetAmount,
        profile: firstBusinessProfile.id,
        targetAccount: recipient.id,
      });
    } catch (error) {
      const res = error as OpenapiError;
      if ((error as any)?.message?.code) throw error;
      throw {
        status_code: res?.status_code || 400,
        message: { code: this.errorCodes.GENERIC_ERROR, data: res.message },
      };
    }

    let transfer;
    try {
      transfer = await this.createTransfer({
        targetAccount: recipient.id,
        quoteUuid: quote.id,
        reason,
      });
    } catch (error) {
      const res = error as OpenapiError;
      if ((error as any)?.message?.code) throw error;
      throw {
        status_code: res?.status_code || 400,
        message: { code: this.errorCodes.GENERIC_ERROR, data: res.message },
      };
    }

    let payment;
    try {
      payment = await this.fundPayment({
        profileId: firstBusinessProfile.id,
        transferId: transfer.id,
      });
      payment.quote = quote;
    } catch (error) {
      const res = error as OpenapiError;
      if ((error as any)?.message?.code) throw error;
      throw {
        status_code: res?.status_code || 400,
        message: { code: this.errorCodes.GENERIC_ERROR, data: res.message },
      };
    }
    return payment;
  }
}

export default Transferwise;
