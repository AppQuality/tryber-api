import { AxiosError } from "@googlemaps/google-maps-services-js/node_modules/axios";
import axios from "axios";

import signRequest from "./signRequest";
import stringToUuid from "./stringToUuid";

class Transferwise {
  apiKey: string;
  baseUrl: string;
  defaultProfile = "default";

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
      if ((error as any)?.response?.data?.errors) {
        throw new Error(JSON.stringify((error as any).response.data.errors));
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
  }: {
    sourceCurrency?: string;
    targetCurrency?: string;
    sourceAmount?: number;
    targetAmount: number;
    profile: string;
  }) {
    const data = {
      sourceCurrency,
      targetCurrency,
      sourceAmount,
      targetAmount,
      profile,
    };
    try {
      return this.request("POST", `/v2/quotes`, data);
    } catch (error) {
      throw error;
    }
  }

  public async getProfiles() {
    try {
      return this.request("GET", `/v1/profiles`);
    } catch (error) {
      throw error;
    }
  }

  public async createRecipient({
    currency = "EUR",
    profile = this.defaultProfile,
    accountHolderName,
    iban,
  }: {
    currency?: string;
    profile?: string;
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
      return this.request("POST", `/v1/accounts`, data);
    } catch (error) {
      if ((error as any).response.data.errors) {
        throw new Error(JSON.stringify((error as any).response.data.errors));
      }
      throw error;
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
    const data = {
      targetAccount,
      quoteUuid,
      customerTransactionId: stringToUuid(reason),
      details: {
        reference: reason,
      },
    };
    try {
      return this.request("POST", `/v1/transfers`, data);
    } catch (error) {
      if ((error as any).response.data.errors) {
        throw new Error(JSON.stringify((error as any).response.data.errors));
      }
      throw error;
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
      throw error;
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
    let quote;
    try {
      quote = await this.createQuote({
        targetAmount,
        profile: firstBusinessProfile.id,
      });
    } catch (error) {
      throw error;
    }

    let recipient;
    try {
      recipient = await this.createRecipient({
        accountHolderName,
        iban,
      });
    } catch (error) {
      throw error;
    }

    let transfer;
    try {
      transfer = await this.createTransfer({
        targetAccount: recipient.id,
        quoteUuid: quote.id,
        reason,
      });
    } catch (error) {
      throw error;
    }

    let payment;
    try {
      payment = await this.fundPayment({
        profileId: firstBusinessProfile.id,
        transferId: transfer.id,
      });
    } catch (error) {
      throw error;
    }
    return payment;
  }
}

export default Transferwise;
