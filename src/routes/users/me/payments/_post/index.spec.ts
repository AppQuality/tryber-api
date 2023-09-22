import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

async function crowdWpOptions() {
  await tryber.tables.WpOptions.do().insert({
    option_id: 1,
    option_name: "crowd_options_option_name",
    option_value:
      'a:17:{s:11:"facebook_id";s:3:"asd";s:20:"facebook_secret_code";s:3:"asd";s:11:"linkedin_id";s:3:"asd";s:20:"linkedin_secret_code";s:3:"asd";s:15:"paypal_live_env";s:15:"paypal_live_env";s:16:"paypal_client_id";s:3:"asd";s:18:"paypal_secret_code";s:3:"asd";s:22:"transfer_wise_live_env";s:22:"transfer_wise_live_env";s:25:"transfer_wise_secret_code";s:3:"asd";s:14:"analitycs_code";s:0:"";s:14:"minimum_payout";s:1:"2";s:13:"appq_cm_email";s:13:"a@example.com";s:9:"adv_email";s:13:"a@example.com";s:11:"adv_project";s:2:"59";s:21:"italian_payment_check";s:21:"italian_payment_check";s:15:"stamp_threshold";s:5:"77.47";s:15:"release_message";s:2:"[]";}',
  });
}

async function clearCrowdWpOptions() {
  await tryber.tables.WpOptions.do().delete();
}

describe("POST /users/me/payments", () => {
  beforeEach(async () => {
    await tryber.tables.WpUsers.do().insert({
      ID: 1,
    });
    await tryber.tables.WpAppqEvdProfile.do().insert({
      id: 1,
      wp_user_id: 1,
      email: "",
      employment_id: 1,
      education_id: 1,
    });
    await crowdWpOptions();
  });
  afterEach(async () => {
    await tryber.tables.WpUsers.do().delete();
    await tryber.tables.WpAppqEvdProfile.do().delete();
    await tryber.tables.WpAppqPaymentRequest.do().delete();
    await clearCrowdWpOptions();
  });
  describe("Valid", () => {
    beforeEach(async () => {
      await tryber.tables.WpAppqFiscalProfile.do().insert({
        id: 1,
        tester_id: 1,
        is_active: 1,
        is_verified: 1,
        fiscal_category: 1,
        name: "",
        surname: "",
        sex: "",
        birth_date: "",
      });

      await tryber.tables.WpAppqPayment.do().insert({
        tester_id: 1,
        amount: 9.99,
      });
      await tryber.tables.WpAppqPayment.do().insert({
        tester_id: 1,
        amount: 50,
      });
      await tryber.tables.WpAppqPayment.do().insert({
        tester_id: 1,
        amount: 70,
      });
      await tryber.tables.WpAppqPayment.do().insert({
        tester_id: 2,
        amount: 70,
      });
    });
    afterEach(async () => {
      await tryber.tables.WpAppqFiscalProfile.do().delete();
      await tryber.tables.WpAppqPayment.do().delete();
    });
    describe("Paypal", () => {
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

      it("Should create a row in the requests with the amount_gross equal to current sum of payments not paid and is_paid=0", async () => {
        const payments = await tryber.tables.WpAppqPayment.do()
          .sum("amount", { as: "total" })
          .where({
            tester_id: 1,
            is_paid: 0,
          })
          .first();

        if (!payments) throw new Error("Payments not found");
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

        const requestData = await tryber.tables.WpAppqPaymentRequest.do()
          .select("amount_gross", "is_paid")
          .where({ id: requestId })
          .first();
        if (!requestData) throw new Error("Request not found");
        expect(requestData.amount_gross).toBe(payments.total);
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
        const attributions = await tryber.tables.WpAppqPayment.do()
          .select("is_requested", "request_id")
          .where({ request_id: requestId });
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

        const requestData = await tryber.tables.WpAppqPaymentRequest.do()
          .select("tester_id")
          .where({ id: requestId })
          .first();
        if (!requestData) throw new Error("Request not found");
        expect(requestData.tester_id).toBe(1);
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

        const requestData = await tryber.tables.WpAppqPaymentRequest.do()
          .select("fiscal_profile_id")
          .where({ id: requestId })
          .first();
        if (!requestData) throw new Error("Request not found");
        expect(requestData.fiscal_profile_id).toBe(1);
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

        const requestData = await tryber.tables.WpAppqPaymentRequest.do()
          .select("paypal_email", "iban")
          .where({ id: requestId })
          .first();
        if (!requestData) throw new Error("Request not found");
        expect(requestData.paypal_email).toBe("test@example.com");
        expect(requestData.iban).toBe(null);
      });
    });

    describe("Iban", () => {
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
        const attributions = await tryber.tables.WpAppqPayment.do()
          .select("is_requested", "request_id")
          .where({ request_id: requestId });
        expect(attributions.length).toBe(3);
        attributions.forEach((attribution) => {
          expect(attribution.is_requested).toBe(1);
        });
      });
      it("Should create a row in the requests with the amount_gross equal to sum of current payments not paid and is_paid=0", async () => {
        const payments = await tryber.tables.WpAppqPayment.do()
          .sum("amount", { as: "total" })
          .where({ tester_id: 1, is_paid: 0 })
          .first();

        if (!payments) throw new Error("Payments not found");
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

        const requestData = await tryber.tables.WpAppqPaymentRequest.do()
          .select("amount_gross", "is_paid")
          .where({ id: requestId })
          .first();
        if (!requestData) throw new Error("Request not found");
        expect(requestData.amount_gross).toBe(payments.total);
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

        const requestData = await tryber.tables.WpAppqPaymentRequest.do()
          .select("tester_id")
          .where({ id: requestId })
          .first();
        if (!requestData) throw new Error("Request not found");
        expect(requestData.tester_id).toBe(1);
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

        const requestData = await tryber.tables.WpAppqPaymentRequest.do()
          .select("fiscal_profile_id")
          .where({ id: requestId })
          .first();
        if (!requestData) throw new Error("Request not found");
        expect(requestData.fiscal_profile_id).toBe(1);
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

        const requestData = await tryber.tables.WpAppqPaymentRequest.do()
          .select("paypal_email", "iban", "account_holder_name")
          .where({ id: requestId })
          .first();
        if (!requestData) throw new Error("Request not found");
        expect(requestData.paypal_email).toBe(null);
        expect(requestData.iban).toBe("IT75T0300203280284975661141");
        expect(requestData.account_holder_name).toBe("John Doe");
      });
    });
  });

  describe("POST /users/me/payments/ - fiscal profile 1", () => {
    beforeEach(async () => {
      await tryber.tables.WpAppqPayment.do().insert({
        tester_id: 1,
        amount: 100,
      });

      await tryber.tables.WpAppqFiscalProfile.do().insert({
        id: 1,
        tester_id: 1,
        is_active: 1,
        is_verified: 1,
        fiscal_category: 1,
        name: "",
        surname: "",
        sex: "",
        birth_date: "",
      });
    });
    afterEach(async () => {
      await tryber.tables.WpAppqPayment.do().truncate();
      await tryber.tables.WpAppqFiscalProfile.do().truncate();
    });

    it("Should create a row in the requests with amount_gross = 100% of the amount if fiscal category is 1", async () => {
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

      const requestData = await tryber.tables.WpAppqPaymentRequest.do()
        .select("amount_gross")
        .where({ id: requestId })
        .first();
      if (!requestData) throw new Error("Request not found");
      expect(requestData.amount_gross).toBe(100);
    });

    it("Should create a row in the requests withholding_tax_percentage = 20  if fiscal category is 1", async () => {
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

      const requestData = await tryber.tables.WpAppqPaymentRequest.do()
        .select("withholding_tax_percentage")
        .where({ id: requestId })
        .first();
      if (!requestData) throw new Error("Request not found");
      expect(requestData.withholding_tax_percentage).toBe(20);
    });

    it("Should create a row in the requests amount_witholding = gross - amount  if fiscal category is 1", async () => {
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

      const requestData = await tryber.tables.WpAppqPaymentRequest.do()
        .select("amount_gross", "amount_withholding")
        .where({ id: requestId })
        .first();
      if (!requestData) throw new Error("Request not found");
      expect(requestData.amount_withholding).toBe(20);
    });
  });

  describe("POST /users/me/payments/ - fiscal profile 2", () => {
    beforeEach(async () => {
      await tryber.tables.WpAppqPayment.do().insert({
        tester_id: 1,
        amount: 100,
      });

      await tryber.tables.WpAppqFiscalProfile.do().insert({
        id: 1,
        tester_id: 1,
        is_active: 1,
        is_verified: 1,
        fiscal_category: 2,
        name: "",
        surname: "",
        sex: "",
        birth_date: "",
      });
    });
    afterEach(async () => {
      await tryber.tables.WpAppqPayment.do().truncate();
      await tryber.tables.WpAppqFiscalProfile.do().truncate();
    });
    it("Should answer 403 if fiscal category is 2 (i.e. witholding > 5000 )", async () => {
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
  describe("POST /users/me/payments/ - fiscal profile 3", () => {
    beforeEach(async () => {
      await tryber.tables.WpAppqPayment.do().insert({
        tester_id: 1,
        amount: 100,
      });

      await tryber.tables.WpAppqFiscalProfile.do().insert({
        id: 1,
        tester_id: 1,
        is_active: 1,
        is_verified: 1,
        fiscal_category: 3,
        name: "",
        surname: "",
        sex: "",
        birth_date: "",
      });
    });
    afterEach(async () => {
      await tryber.tables.WpAppqPayment.do().truncate();
      await tryber.tables.WpAppqFiscalProfile.do().truncate();
    });
    it("Should answer 403 if fiscal category is 3 (i.e. vat )", async () => {
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

  describe("POST /users/me/payments/ - fiscal profile 4", () => {
    beforeEach(async () => {
      await tryber.tables.WpAppqPayment.do().insert({
        tester_id: 1,
        amount: 100,
      });

      await tryber.tables.WpAppqFiscalProfile.do().insert({
        id: 1,
        tester_id: 1,
        is_active: 1,
        is_verified: 1,
        fiscal_category: 4,
        name: "",
        surname: "",
        sex: "",
        birth_date: "",
      });
    });
    afterEach(async () => {
      await tryber.tables.WpAppqPayment.do().truncate();
      await tryber.tables.WpAppqFiscalProfile.do().truncate();
    });

    it("Should create a row in the requests withholding_tax_percentage = 0  if fiscal category is 4", async () => {
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

      const requestData = await tryber.tables.WpAppqPaymentRequest.do()
        .select("withholding_tax_percentage")
        .where({ id: requestId })
        .first();
      if (!requestData) throw new Error("Request not found");
      expect(requestData.withholding_tax_percentage).toBe(0);
    });

    it("Should create a row in the requests with amount_gross = 100% of the amount if fiscal category is 4", async () => {
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

      const requestData = await tryber.tables.WpAppqPaymentRequest.do()
        .select("amount_gross")
        .where({ id: requestId })
        .first();
      if (!requestData) throw new Error("Request not found");
      expect(requestData.amount_gross).toBe(100);
    });

    it("Should create a row in the requests amount_witholding = gross - amount  if fiscal category is 4", async () => {
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

      const requestData = await tryber.tables.WpAppqPaymentRequest.do()
        .select("amount_withholding")
        .where({ id: requestId })
        .first();
      if (!requestData) throw new Error("Request not found");
      expect(requestData.amount_withholding).toBe(0);
    });

    it("Should answer 200 if fiscal category is 4 (i.e. foreign)", async () => {
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
  });

  describe("POST /users/me/payments/ - fiscal profile 5", () => {
    beforeEach(async () => {
      await tryber.tables.WpAppqPayment.do().insert({
        tester_id: 1,
        amount: 100,
      });

      await tryber.tables.WpAppqFiscalProfile.do().insert({
        id: 1,
        tester_id: 1,
        is_active: 1,
        is_verified: 1,
        fiscal_category: 5,
        name: "",
        surname: "",
        sex: "",
        birth_date: "",
      });
    });
    afterEach(async () => {
      await tryber.tables.WpAppqPayment.do().truncate();
      await tryber.tables.WpAppqFiscalProfile.do().truncate();
    });
    it("Should answer 403 if fiscal category is 3 (i.e. company )", async () => {
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
      await tryber.tables.WpAppqPayment.do().insert({
        tester_id: 1,
        amount: 100,
      });

      await tryber.tables.WpAppqFiscalProfile.do().insert({
        id: 1,
        tester_id: 1,
        is_active: 1,
        is_verified: 1,
        fiscal_category: 1,
        name: "",
        surname: "",
        sex: "",
        birth_date: "",
      });
    });
    afterEach(async () => {
      await tryber.tables.WpAppqPayment.do().delete();
      await tryber.tables.WpAppqFiscalProfile.do().delete();
    });

    it("Should create a row with stamp_required = true if the amount gross is over 77,47", async () => {
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

      const requestData = await tryber.tables.WpAppqPaymentRequest.do()
        .select("stamp_required")
        .where({ id: requestId })
        .first();
      if (!requestData) throw new Error("Request not found");
      expect(requestData.stamp_required).toBe(1);
    });
  });

  describe("POST /users/me/payments - stamp not required", () => {
    beforeEach(async () => {
      await tryber.tables.WpAppqPayment.do().insert({
        tester_id: 1,
        amount: 61.95,
      });
      await tryber.tables.WpAppqFiscalProfile.do().insert({
        id: 1,
        tester_id: 1,
        is_active: 1,
        is_verified: 1,
        fiscal_category: 1,
        name: "",
        surname: "",
        sex: "",
        birth_date: "",
      });
    });
    afterEach(async () => {
      await tryber.tables.WpAppqPayment.do().delete();
      await tryber.tables.WpAppqFiscalProfile.do().delete();
    });

    it("Should create a row with stamp_required = false if the amount gross is under 77,47", async () => {
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

      const requestData = await tryber.tables.WpAppqPaymentRequest.do()
        .select("stamp_required")
        .where({ id: requestId })
        .first();
      if (!requestData) throw new Error("Request not found");
      expect(requestData.stamp_required).toBe(0);
    });
  });

  describe("POST /users/me/payments - empty booty", () => {
    it("Should answer 403 if logged in but with empty booty", async () => {
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

  describe("POST /users/me/payments - inactive fiscal profile", () => {
    beforeEach(async () => {
      await tryber.tables.WpAppqPayment.do().insert({
        tester_id: 1,
        amount: 69.99,
      });
      await tryber.tables.WpAppqFiscalProfile.do().insert({
        id: 1,
        tester_id: 1,
        is_active: 0,
        is_verified: 1,
        fiscal_category: 1,
        name: "",
        surname: "",
        sex: "",
        birth_date: "",
      });
    });

    afterEach(async () => {
      await tryber.tables.WpAppqPayment.do().delete();
      await tryber.tables.WpAppqFiscalProfile.do().truncate();
    });

    it("Should answer 403 if logged with a booty but without fiscal profile", async () => {
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

  describe("POST /users/me/payments - under threshold", () => {
    beforeEach(async () => {
      await tryber.tables.WpAppqPayment.do().insert({
        tester_id: 1,
        amount: 0.01,
      });
      await tryber.tables.WpAppqFiscalProfile.do().insert({
        id: 1,
        tester_id: 1,
        is_active: 1,
        is_verified: 1,
        fiscal_category: 1,
        name: "",
        surname: "",
        sex: "",
        birth_date: "",
      });
    });

    afterEach(async () => {
      await tryber.tables.WpAppqPayment.do().delete();
      await tryber.tables.WpAppqFiscalProfile.do().truncate();
    });

    it("Should answer 403 if logged with a valid fiscal profile but the booty under threshold", async () => {
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

  describe("POST /users/me/payments - processing payment", () => {
    beforeEach(async () => {
      await tryber.tables.WpAppqPayment.do().insert({
        tester_id: 1,
        amount: 10,
      });
      await tryber.tables.WpAppqFiscalProfile.do().insert({
        id: 1,
        tester_id: 1,
        is_active: 1,
        is_verified: 1,
        fiscal_category: 1,
        name: "",
        surname: "",
        sex: "",
        birth_date: "",
      });
      await tryber.tables.WpAppqPaymentRequest.do().insert({
        id: 1,
        tester_id: 1,
        amount: 50,
        is_paid: 0,
        under_threshold: 0,
        withholding_tax_percentage: 20,
      });
    });

    afterEach(async () => {
      await tryber.tables.WpAppqPayment.do().delete();
      await tryber.tables.WpAppqFiscalProfile.do().delete();
      await tryber.tables.WpAppqPaymentRequest.do().delete();
    });

    it("Should answer 403 if logged with a valid fiscal, a booty over threshold but with a payment already processing", async () => {
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
});
