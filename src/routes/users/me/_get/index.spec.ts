import Profile from "@src/__mocks__/mockedDb/profile";
import WpUsers from "@src/__mocks__/mockedDb/wp_users";
import { data as paymentRequestData } from "@src/__mocks__/mockedDb/paymentRequest";
import { data as fiscalProfileData } from "@src/__mocks__/mockedDb/fiscalProfile";

import app from "@src/app";
import request from "supertest";

describe("GET /users/me", () => {
  beforeEach(async () => {
    return new Promise(async (resolve) => {
      await Profile.insert();
      await WpUsers.insert();
      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      await Profile.clear();
      await WpUsers.clear();
      resolve(null);
    });
  });

  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).get("/users/me");
    expect(response.status).toBe(403);
  });
  it("Should answer 200 if logged in tryber", async () => {
    const response = await request(app)
      .get("/users/me")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
  });
  describe("GET /users/me - fiscal profile and Earnings < 5000 - fiscal_category = 1", () => {
    beforeEach(async () => {
      return new Promise(async (resolve) => {
        await fiscalProfileData.validFiscalProfile({ fiscal_category: 1 });
        await paymentRequestData.processingPaypalPayment({
          id: 1,
          amount: 1000,
          amount_gross: 1250, // 25% withholding tax if <5000
        });
        await paymentRequestData.paidPaypalPayment({
          id: 2,
          amount: 2000,
          amount_gross: 2500, // 25% withholding tax if <5000
        });
        resolve(null);
      });
    });
    afterEach(async () => {
      return new Promise(async (resolve) => {
        await fiscalProfileData.drop();
        await paymentRequestData.drop();
        resolve(null);
      });
    });
    it("Should return booty as net and gross if Earnings are < 5000", async () => {
      const response = await request(app)
        .get("/users/me?fields=booty")
        .set("authorization", "Bearer tester");
      expect(response.body.booty).toBeDefined();
      expect(response.body.booty).toEqual({
        net: { value: 2000, currency: "EUR" },
        gross: { value: 2500, currency: "EUR" },
      });
    });
  });
  describe("GET /users/me - fiscal profile category !== 1", () => {
    beforeEach(async () => {
      return new Promise(async (resolve) => {
        await fiscalProfileData.validFiscalProfile({ fiscal_category: 2 });
        await paymentRequestData.processingPaypalPayment({
          id: 1,
          amount: 5011.2, // === amount_gross * 1.16 * 0.72 (72%)
          amount_gross: 6000,
        });
        await paymentRequestData.paidPaypalPayment({
          id: 2,
          amount: 5011.2, // === amount_gross * 1.16 * 0.72 (72%)
          amount_gross: 6000,
        });
        resolve(null);
      });
    });
    afterEach(async () => {
      return new Promise(async (resolve) => {
        await fiscalProfileData.drop();
        await paymentRequestData.drop();
        resolve(null);
      });
    });
    it("Should return booty gross", async () => {
      const response = await request(app)
        .get("/users/me?fields=booty")
        .set("authorization", "Bearer tester");
      expect(response.body.booty).toBeDefined();
      expect(response.body.booty).toEqual({
        gross: { value: 6000, currency: "EUR" },
      });
      expect(response.body.booty).not.toHaveProperty("net");
    });
  });
});
