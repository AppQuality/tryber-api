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
      profileTable.create();
      fiscalProfileTable.create();
      wpOptionsTable.create();
      wpOptionsData.crowdWpOptions();
      paymentRequestTable.create();

      data.tester = profileData.testerWithBooty();
      fiscalProfileData.validFiscalProfile({ tester_id: data.tester.id });
      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      profileTable.drop();
      fiscalProfileTable.drop();
      wpOptionsTable.drop();
      paymentRequestTable.drop();
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
});

describe("POST /users/me/payments - invalid data", () => {
  beforeEach(async () => {
    return new Promise(async (resolve) => {
      profileTable.create();
      fiscalProfileTable.create();
      wpOptionsTable.create();
      wpOptionsData.crowdWpOptions();
      paymentRequestTable.create();

      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      profileTable.drop();
      fiscalProfileTable.drop();
      wpOptionsTable.drop();
      paymentRequestTable.drop();
      resolve(null);
    });
  });

  it("Should answer 403 if logged in but with empty booty", async () => {
    profileData.testerWithoutBooty();
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
    const tester = profileData.testerWithBooty();
    fiscalProfileData.inactiveFiscalProfile({ tester_id: tester.id });

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
    const tester = profileData.testerWithBooty();
    fiscalProfileData.invalidFiscalProfile({ tester_id: tester.id });

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
    const tester = profileData.testerWithBooty({
      pending_booty: 0.01,
    });
    fiscalProfileData.validFiscalProfile({ tester_id: tester.id });

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
    const tester = profileData.testerWithBooty();
    fiscalProfileData.validFiscalProfile({ tester_id: tester.id });
    paymentRequestData.processingPaypalPayment({ tester_id: tester.id });
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
