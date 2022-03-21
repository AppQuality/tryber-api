import {
  data as fiscalProfileData,
  table as fiscalProfileTable,
} from "@src/__mocks__/mockedDb/fiscalProfile";
import {
  data as paymentRequestData,
  table as paymentRequestTable,
} from "@src/__mocks__/mockedDb/paymentRequest";
import {
  data as profileData,
  table as profileTable,
} from "@src/__mocks__/mockedDb/profile";
import {
  data as wpOptionsData,
  table as wpOptionsTable,
} from "@src/__mocks__/mockedDb/wp_options";
import app from "@src/app";
import sqlite3 from "@src/features/sqlite";
import request from "supertest";

jest.mock("@src/features/db");
jest.mock("@appquality/wp-auth");

describe("POST /users/me/payments - valid paypal", () => {
  const data: any = {};
  beforeEach(async () => {
    return new Promise(async (resolve) => {
      await profileTable.create();
      await fiscalProfileTable.create();
      await wpOptionsTable.create();
      await wpOptionsData.crowdWpOptions();
      await paymentRequestTable.create();

      data.tester = await profileData.testerWithBooty({
        pending_booty: 129.99,
      });
      data.tester = {
        ...data.tester,
        expected_gross: 162.49,
        expected_withholding: 32.5,
      };
      data.fiscalProfile = await fiscalProfileData.validFiscalProfile({
        tester_id: data.tester.id,
      });
      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      await profileTable.drop();
      await fiscalProfileTable.drop();
      await wpOptionsTable.drop();
      await paymentRequestTable.drop();
      resolve(null);
    });
  });

  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).post("/users/me/payments");
    expect(response.status).toBe(403);
  });

  it("Should answer 200 if not logged in", async () => {
    const response = await request(app)
      .post("/users/me/payments")
      .send({
        method: {
          type: "paypal",
          email: "test@example.com",
        },
      })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
  });

  it("Should create a row in the requests with the amount equal to current pending booty and is_paid=0", async () => {
    const response = await request(app)
      .post("/users/me/payments")
      .send({
        method: {
          type: "paypal",
          email: "test@example.com",
        },
      })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    const requestId: number = response.body.id;
    const requestData = await sqlite3.get(
      `SELECT amount,is_paid FROM wp_appq_payment_request WHERE id=${requestId}`
    );
    expect(requestData.amount).toBe(data.tester.pending_booty);
    expect(requestData.is_paid).toBe(0);
  });
  it("Should create a row in the requests with tester_id = current tester id", async () => {
    const response = await request(app)
      .post("/users/me/payments")
      .send({
        method: {
          type: "paypal",
          email: "test@example.com",
        },
      })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    const requestId: number = response.body.id;
    const requestData = await sqlite3.get(
      `SELECT tester_id FROM wp_appq_payment_request WHERE id=${requestId}`
    );
    expect(requestData.tester_id).toBe(data.tester.id);
  });

  it("Should create a row in the requests with fiscal_profile_id = current tester fiscal id", async () => {
    const response = await request(app)
      .post("/users/me/payments")
      .send({
        method: {
          type: "paypal",
          email: "test@example.com",
        },
      })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    const requestId: number = response.body.id;
    const requestData = await sqlite3.get(
      `SELECT fiscal_profile_id FROM wp_appq_payment_request WHERE id=${requestId}`
    );
    expect(requestData.fiscal_profile_id).toBe(data.fiscalProfile.id);
  });

  it("Should create a row in the requests with amount_gross = 125% of the amount", async () => {
    const response = await request(app)
      .post("/users/me/payments")
      .send({
        method: {
          type: "paypal",
          email: "test@example.com",
        },
      })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    const requestId: number = response.body.id;
    const requestData = await sqlite3.get(
      `SELECT amount_gross FROM wp_appq_payment_request WHERE id=${requestId}`
    );
    expect(requestData.amount_gross).toBe(data.tester.expected_gross);
  });

  it("Should create a row in the requests amount_witholding = gross - amount", async () => {
    const response = await request(app)
      .post("/users/me/payments")
      .send({
        method: {
          type: "paypal",
          email: "test@example.com",
        },
      })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    const requestId: number = response.body.id;
    const requestData = await sqlite3.get(
      `SELECT amount_gross,amount_withholding FROM wp_appq_payment_request WHERE id=${requestId}`
    );
    expect(requestData.amount_withholding).toBe(
      data.tester.expected_withholding
    );
  });
});

describe("POST /users/me/payments - invalid data", () => {
  beforeEach(async () => {
    return new Promise(async (resolve) => {
      await profileTable.create();
      await fiscalProfileTable.create();
      await wpOptionsTable.create();
      await wpOptionsData.crowdWpOptions();
      await paymentRequestTable.create();

      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      await profileTable.drop();
      await fiscalProfileTable.drop();
      await wpOptionsTable.drop();
      await paymentRequestTable.drop();
      resolve(null);
    });
  });

  it("Should answer 403 if logged in but with empty booty", async () => {
    await profileData.testerWithoutBooty();
    const response = await request(app)
      .post("/users/me/payments")
      .set("authorization", "Bearer tester")
      .send({
        method: {
          type: "paypal",
          email: "test@example.com",
        },
      });
    expect(response.status).toBe(403);
  });

  it("Should answer 403 if logged with a booty but without fiscal profile", async () => {
    const tester = await profileData.testerWithBooty();
    await fiscalProfileData.inactiveFiscalProfile({ tester_id: tester.id });

    const response = await request(app)
      .post("/users/me/payments")
      .set("authorization", "Bearer tester")
      .send({
        method: {
          type: "paypal",
          email: "test@example.com",
        },
      });
    expect(response.status).toBe(403);
  });

  it("Should answer 403 if logged with a booty but with an invalid fiscal profile", async () => {
    const tester = await profileData.testerWithBooty();
    await fiscalProfileData.invalidFiscalProfile({ tester_id: tester.id });

    const response = await request(app)
      .post("/users/me/payments")
      .set("authorization", "Bearer tester")
      .send({
        method: {
          type: "paypal",
          email: "test@example.com",
        },
      });
    expect(response.status).toBe(403);
  });
  it("Should answer 403 if logged with a valid fiscal profile but the booty under threshold", async () => {
    const tester = await profileData.testerWithBooty({
      pending_booty: 0.01,
    });
    await fiscalProfileData.validFiscalProfile({ tester_id: tester.id });

    const response = await request(app)
      .post("/users/me/payments")
      .set("authorization", "Bearer tester")
      .send({
        method: {
          type: "paypal",
          email: "test@example.com",
        },
      });
    expect(response.status).toBe(403);
  });
  it("Should answer 403 if logged with a valid fiscal, a booty over threshold but with a payment already processing", async () => {
    const tester = await profileData.testerWithBooty();
    await fiscalProfileData.validFiscalProfile({ tester_id: tester.id });
    await paymentRequestData.processingPaypalPayment({ tester_id: tester.id });
    const response = await request(app)
      .post("/users/me/payments")
      .set("authorization", "Bearer tester")
      .send({
        method: {
          type: "paypal",
          email: "test@example.com",
        },
      });
    expect(response.status).toBe(403);
  });
});
