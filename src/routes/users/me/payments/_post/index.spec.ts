import app from "@src/app";
import sqlite3 from "@src/features/sqlite";
import Attributions from "@src/__mocks__/mockedDb/attributions";
import { data as fiscalProfileData } from "@src/__mocks__/mockedDb/fiscalProfile";
import { data as paymentRequestData } from "@src/__mocks__/mockedDb/paymentRequest";
import Profile from "@src/__mocks__/mockedDb/profile";
import WpOptions from "@src/__mocks__/mockedDb/wp_options";
import WpUsers from "@src/__mocks__/mockedDb/wp_users";
import request from "supertest";

describe("POST /users/me/payments - valid paypal", () => {
  const data: any = {};
  beforeEach(async () => {
    return new Promise(async (resolve) => {
      await WpUsers.insert();
      data.tester = await Profile.insert({
        pending_booty: 129.99,
      });
      data.fiscalProfile = await fiscalProfileData.validFiscalProfile({
        tester_id: data.tester.id,
      });
      Attributions.insert({
        id: 1,
        tester_id: data.tester.id,
        amount: 9.99,
      });
      Attributions.insert({
        id: 2,
        tester_id: data.tester.id,
        amount: 50,
      });
      Attributions.insert({
        id: 3,
        tester_id: data.tester.id,
        amount: 70,
      });
      Attributions.insert({
        id: 4,
        tester_id: data.tester.id + 1,
        amount: 70,
      });

      await WpOptions.crowdWpOptions();

      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      await WpUsers.clear();
      await Profile.clear();
      await fiscalProfileData.drop();
      await WpOptions.clear();
      await paymentRequestData.drop();
      await Attributions.clear();
      resolve(null);
    });
  });

  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).post("/users/me/payments");
    expect(response.status).toBe(403);
  });
  it("Should answer 200 if logged in", async () => {
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

  it("Should update the attributions with is_requested =1 and request_id = the id of the inserted request ", async () => {
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
    const attributions = await Attributions.all(
      ["is_requested", "request_id"],
      [
        {
          request_id: requestId,
        },
      ]
    );
    expect(attributions.length).toBe(3);
    attributions.forEach((attribution) => {
      expect(attribution.is_requested).toBe(1);
    });
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

  it("Should create a row in the requests paypal_email = the email sent in the body and iban null", async () => {
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
      `SELECT paypal_email,iban FROM wp_appq_payment_request WHERE id=${requestId}`
    );
    expect(requestData.paypal_email).toBe("test@example.com");
    expect(requestData.iban).toBe(null);
  });
});

describe("POST /users/me/payments - valid iban", () => {
  const data: any = {};
  beforeEach(async () => {
    return new Promise(async (resolve) => {
      WpUsers.insert({
        ID: 1,
      });
      data.tester = await Profile.insert({
        pending_booty: 129.99,
      });
      data.fiscalProfile = await fiscalProfileData.validFiscalProfile({
        tester_id: data.tester.id,
      });

      Attributions.insert({
        id: 1,
        tester_id: data.tester.id,
        amount: 9.99,
      });
      Attributions.insert({
        id: 2,
        tester_id: data.tester.id,
        amount: 50,
      });
      Attributions.insert({
        id: 3,
        tester_id: data.tester.id,
        amount: 70,
      });
      Attributions.insert({
        id: 4,
        tester_id: data.tester.id + 1,
        amount: 70,
      });

      await WpOptions.crowdWpOptions();
      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      await WpUsers.clear();
      await Attributions.clear();
      await Profile.clear();
      await fiscalProfileData.drop();
      await WpOptions.clear();
      await paymentRequestData.drop();
      resolve(null);
    });
  });

  it("Should answer 200 if logged in", async () => {
    const response = await request(app)
      .post("/users/me/payments")
      .send({
        method: {
          type: "iban",
          iban: "IT75T0300203280284975661141",
          accountHolderName: "John Doe",
        },
      })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
  });

  it("Should update the attributions with is_requested =1 and request_id = the id of the inserted request ", async () => {
    const response = await request(app)
      .post("/users/me/payments")
      .send({
        method: {
          type: "iban",
          iban: "IT75T0300203280284975661141",
          accountHolderName: "John Doe",
        },
      })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    const requestId: number = response.body.id;
    const attributions = await Attributions.all(
      ["is_requested", "request_id"],
      [
        {
          request_id: requestId,
        },
      ]
    );
    expect(attributions.length).toBe(3);
    attributions.forEach((attribution) => {
      expect(attribution.is_requested).toBe(1);
    });
  });
  it("Should create a row in the requests with the amount equal to current pending booty and is_paid=0", async () => {
    const response = await request(app)
      .post("/users/me/payments")
      .send({
        method: {
          type: "iban",
          iban: "IT75T0300203280284975661141",
          accountHolderName: "John Doe",
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
          type: "iban",
          iban: "IT75T0300203280284975661141",
          accountHolderName: "John Doe",
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
          type: "iban",
          iban: "IT75T0300203280284975661141",
          accountHolderName: "John Doe",
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

  it("Should create a row in the requests with the body data for iban and account_holder and paypal_email null", async () => {
    const response = await request(app)
      .post("/users/me/payments")
      .send({
        method: {
          type: "iban",
          iban: "IT75T0300203280284975661141",
          accountHolderName: "John Doe",
        },
      })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    const requestId: number = response.body.id;
    const requestData = await sqlite3.get(
      `SELECT paypal_email,iban,account_holder_name FROM wp_appq_payment_request WHERE id=${requestId}`
    );
    expect(requestData.paypal_email).toBe(null);
    expect(requestData.iban).toBe("IT75T0300203280284975661141");
    expect(requestData.account_holder_name).toBe("John Doe");
  });
});

describe("POST /users/me/payments/ - fiscal profiles", () => {
  const data: any = {};
  beforeAll(async () => {
    return new Promise(async (resolve) => {
      await WpOptions.crowdWpOptions();
      resolve(null);
    });
  });
  afterAll(async () => {
    return new Promise(async (resolve) => {
      await WpOptions.clear();
      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      await Attributions.clear();
      await Profile.clear();
      await fiscalProfileData.drop();
      await paymentRequestData.drop();
      await WpUsers.clear();
      resolve(null);
    });
  });

  it("Should create a row in the requests with amount_gross = 125% of the amount if fiscal category is 1", async () => {
    await WpUsers.insert({
      ID: 1,
    });
    data.tester = await Profile.insert({
      pending_booty: 129.99,
    });
    data.tester = {
      ...data.tester,
      expected_gross: 162.49,
      expected_withholding: 32.5,
    };
    data.attribution = await Attributions.insert({
      amount: 129.99,
      is_paid: 0,
    });

    data.fiscalProfile = await fiscalProfileData.validFiscalProfile({
      tester_id: data.tester.id,
      fiscal_category: 1,
    });
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

  it("Should create a row in the requests withholding_tax_percentage = 20  if fiscal category is 1", async () => {
    await WpUsers.insert({
      ID: 1,
    });
    data.tester = await Profile.insert({
      pending_booty: 100,
    });
    data.fiscalProfile = await fiscalProfileData.validFiscalProfile({
      tester_id: data.tester.id,
      fiscal_category: 1,
    });
    data.attribution = await Attributions.insert({
      amount: data.tester.pending_booty,
      is_paid: 0,
    });
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
      `SELECT withholding_tax_percentage FROM wp_appq_payment_request WHERE id=${requestId}`
    );
    expect(requestData.withholding_tax_percentage).toBe(20);
  });

  it("Should create a row in the requests withholding_tax_percentage = 0  if fiscal category is 4", async () => {
    await WpUsers.insert({
      ID: 1,
    });
    data.tester = await Profile.insert({
      pending_booty: 100,
    });
    data.fiscalProfile = await fiscalProfileData.validFiscalProfile({
      tester_id: data.tester.id,
      fiscal_category: 4,
    });
    data.attribution = await Attributions.insert({
      amount: data.tester.pending_booty,
      is_paid: 0,
    });
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
      `SELECT withholding_tax_percentage FROM wp_appq_payment_request WHERE id=${requestId}`
    );
    expect(requestData.withholding_tax_percentage).toBe(0);
  });
  it("Should create a row in the requests amount_witholding = gross - amount  if fiscal category is 1", async () => {
    await WpUsers.insert({
      ID: 1,
    });
    data.tester = await Profile.insert({
      pending_booty: 129.99,
    });
    data.attribution = await Attributions.insert({
      amount: data.tester.pending_booty,
      is_paid: 0,
    });
    data.tester = {
      ...data.tester,
      expected_gross: 162.49,
      expected_withholding: 32.5,
    };
    data.fiscalProfile = await fiscalProfileData.validFiscalProfile({
      tester_id: data.tester.id,
      fiscal_category: 1,
    });
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

  it("Should create a row in the requests with amount_gross = 100% of the amount if fiscal category is 4", async () => {
    await WpUsers.insert({
      ID: 1,
    });
    data.tester = await Profile.insert({
      pending_booty: 129.99,
    });
    data.tester = {
      ...data.tester,
      expected_gross: 129.99,
    };
    data.attribution = await Attributions.insert({
      amount: data.tester.pending_booty,
      is_paid: 0,
    });
    data.fiscalProfile = await fiscalProfileData.validFiscalProfile({
      tester_id: data.tester.id,
      fiscal_category: 4,
    });
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

  it("Should create a row in the requests amount_witholding = gross - amount  if fiscal category is 4", async () => {
    await WpUsers.insert({
      ID: 1,
    });
    data.tester = await Profile.insert({
      pending_booty: 129.99,
    });
    data.tester = {
      ...data.tester,
      expected_withholding: 0,
    };
    data.fiscalProfile = await fiscalProfileData.validFiscalProfile({
      tester_id: data.tester.id,
      fiscal_category: 4,
    });
    data.attribution = await Attributions.insert({
      amount: data.tester.pending_booty,
      is_paid: 0,
    });
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
      `SELECT amount_withholding FROM wp_appq_payment_request WHERE id=${requestId}`
    );
    expect(requestData.amount_withholding).toBe(
      data.tester.expected_withholding
    );
  });
  it("Should answer 403 if fiscal category is 2", async () => {
    await WpUsers.insert({
      ID: 1,
    });
    data.tester = await Profile.insert({
      pending_booty: 129.99,
    });
    data.attribution = await Attributions.insert({
      amount: data.tester.pending_booty,
      is_paid: 0,
    });
    data.fiscalProfile = await fiscalProfileData.validFiscalProfile({
      tester_id: data.tester.id,
      fiscal_category: 2,
    });
    const response = await request(app)
      .post("/users/me/payments")
      .send({
        method: {
          type: "paypal",
          email: "test@example.com",
        },
      })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });
  it("Should answer 403 if fiscal category is 3", async () => {
    await WpUsers.insert({
      ID: 1,
    });
    data.tester = await Profile.insert({
      pending_booty: 129.99,
    });
    data.fiscalProfile = await fiscalProfileData.validFiscalProfile({
      tester_id: data.tester.id,
      fiscal_category: 3,
    });
    data.attribution = await Attributions.insert({
      amount: data.tester.pending_booty,
      is_paid: 0,
    });
    const response = await request(app)
      .post("/users/me/payments")
      .send({
        method: {
          type: "paypal",
          email: "test@example.com",
        },
      })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });
});

describe("POST /users/me/payments - stamp required", () => {
  beforeEach(async () => {
    return new Promise(async (resolve) => {
      await WpOptions.crowdWpOptions();
      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      await Profile.clear();
      await Attributions.clear();
      await fiscalProfileData.drop();
      await WpOptions.clear();
      await paymentRequestData.drop();
      await WpUsers.clear();
      resolve(null);
    });
  });

  it("Should create a row with stamp_required = true if the amount gross is over 77,47", async () => {
    await WpUsers.insert({
      ID: 1,
    });
    const tester = await Profile.insert({
      pending_booty: 61.99,
    });
    await fiscalProfileData.validFiscalProfile({
      tester_id: tester.id,
    });
    const attribution = await Attributions.insert({
      amount: tester.pending_booty,
      is_paid: 0,
    });
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
      `SELECT stamp_required FROM wp_appq_payment_request WHERE id=${requestId}`
    );
    expect(requestData.stamp_required).toBe(1);
  });
  it("Should create a row with stamp_required = false if the amount gross is under 77,47", async () => {
    await WpUsers.insert({
      ID: 1,
    });
    const tester = await Profile.insert({
      pending_booty: 61.95,
    });
    const attribution = await Attributions.insert({
      amount: tester.pending_booty,
      is_paid: 0,
    });
    await fiscalProfileData.validFiscalProfile({
      tester_id: tester.id,
    });
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
      `SELECT stamp_required FROM wp_appq_payment_request WHERE id=${requestId}`
    );
    expect(requestData.stamp_required).toBe(0);
  });
});
describe("POST /users/me/payments - invalid data", () => {
  beforeEach(async () => {
    return new Promise(async (resolve) => {
      await WpOptions.crowdWpOptions();

      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      await Profile.clear();
      await fiscalProfileData.drop();
      await WpOptions.clear();
      await paymentRequestData.drop();
      await Attributions.clear();
      await WpUsers.clear();
      resolve(null);
    });
  });

  it("Should answer 403 if logged in but with empty booty", async () => {
    await WpUsers.insert({
      ID: 1,
    });
    await Profile.insert();
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
    await WpUsers.insert({
      ID: 1,
    });
    const tester = await Profile.insert({
      pending_booty: 100,
    });
    await fiscalProfileData.inactiveFiscalProfile({ tester_id: tester.id });
    const attribution = await Attributions.insert({
      amount: 69.99,
      is_paid: 0,
    });
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
    await WpUsers.insert({
      ID: 1,
    });
    const tester = await Profile.insert({
      pending_booty: 100,
    });
    await fiscalProfileData.invalidFiscalProfile({ tester_id: tester.id });
    const attribution = await Attributions.insert({
      amount: tester.pending_booty,
      is_paid: 0,
    });
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
    await WpUsers.insert({
      ID: 1,
    });
    const tester = await Profile.insert({
      pending_booty: 0.01,
    });
    const attribution = await Attributions.insert({
      amount: tester.pending_booty,
      is_paid: 0,
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
    await WpUsers.insert({
      ID: 1,
    });
    const tester = await Profile.insert({
      pending_booty: 100,
    });
    await fiscalProfileData.validFiscalProfile({ tester_id: tester.id });
    await paymentRequestData.processingPaypalPayment({ tester_id: tester.id });
    const attribution = await Attributions.insert({
      amount: tester.pending_booty,
      is_paid: 0,
    });
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
