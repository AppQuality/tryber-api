import sgMail from "@sendgrid/mail";
import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

const fiscalProfile = {
  id: 1,
  tester_id: 1,
  is_active: 1,
  is_verified: 1,
  fiscal_category: 1,
  name: "",
  surname: "",
  sex: "",
  birth_date: "",
  address: "Via Lancia",
  address_number: "10",
  postal_code: "20021",
  city: "Milano",
  province: "MI",
  fiscal_id: "BJD3FG7H2JK5JN9PQ",
};

const mockedSendgrid = jest.mocked(sgMail, true);

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
  const oldEnv = {
    PAYMENT_REQUESTED_EMAIL: process.env.PAYMENT_REQUESTED_EMAIL,
    PAYMENT_INVOICE_RECAP_EMAIL_WITHOLDING_EXTRA:
      process.env.PAYMENT_INVOICE_RECAP_EMAIL_WITHOLDING_EXTRA,
    PAYMENT_INVOICE_RECAP_EMAIL_VAT:
      process.env.PAYMENT_INVOICE_RECAP_EMAIL_VAT,
    PAYMENT_INVOICE_RECAP_EMAIL_COMPANY:
      process.env.PAYMENT_INVOICE_RECAP_EMAIL_COMPANY,
  };
  beforeAll(async () => {
    process.env.PAYMENT_REQUESTED_EMAIL = "PAYMENT_REQUESTED_EMAIL";
    process.env.PAYMENT_INVOICE_RECAP_EMAIL_WITHOLDING_EXTRA =
      "PAYMENT_INVOICE_RECAP_EMAIL_WITHOLDING_EXTRA";
    process.env.PAYMENT_INVOICE_RECAP_EMAIL_VAT =
      "PAYMENT_INVOICE_RECAP_EMAIL_VAT";
    process.env.PAYMENT_INVOICE_RECAP_EMAIL_COMPANY =
      "PAYMENT_INVOICE_RECAP_EMAIL_COMPANY";
    await tryber.tables.WpAppqUnlayerMailTemplate.do().insert([
      {
        id: 1,
        html_body:
          "PAYMENT_REQUESTED_EMAIL_BODY {Payment.address} {Payment.fiscalType} {Profile.identificationNumber}",
        name: "PAYMENT_REQUESTED_EMAIL_SUBJECT",
        json_body: "",
        last_editor_tester_id: 1,
        lang: "en",
        category_id: 1,
      },
      {
        id: 2,
        html_body:
          "PAYMENT_INVOICE_RECAP_EMAIL_WITHOLDING_EXTRA_BODY {Payment.grossINPS} {Payment.address} {Payment.fiscalType} {Profile.identificationNumber}",
        name: "PAYMENT_INVOICE_RECAP_EMAIL_WITHOLDING_EXTRA_SUBJECT",
        json_body: "",
        last_editor_tester_id: 1,
        lang: "en",
        category_id: 1,
      },
      {
        id: 3,
        html_body:
          "PAYMENT_INVOICE_RECAP_EMAIL_VAT_BODY {Payment.address} {Payment.fiscalType} {Profile.identificationNumber}",
        name: "PAYMENT_INVOICE_RECAP_EMAIL_VAT_SUBJECT",
        json_body: "",
        last_editor_tester_id: 1,
        lang: "en",
        category_id: 1,
      },
      {
        id: 4,
        html_body:
          "PAYMENT_INVOICE_RECAP_EMAIL_COMPANY_BODY {Payment.address} {Payment.fiscalType} {Profile.identificationNumber}",
        name: "PAYMENT_INVOICE_RECAP_EMAIL_COMPANY_SUBJECT",
        json_body: "",
        last_editor_tester_id: 1,
        lang: "en",
        category_id: 1,
      },
    ]);

    await tryber.tables.WpAppqEventTransactionalMail.do().insert([
      {
        id: 1,
        event_name: "PAYMENT_REQUESTED_EMAIL",
        template_id: 1,
        last_editor_tester_id: 1,
      },
      {
        id: 2,
        event_name: "PAYMENT_INVOICE_RECAP_EMAIL_WITHOLDING_EXTRA",
        template_id: 2,
        last_editor_tester_id: 1,
      },
      {
        id: 3,
        event_name: "PAYMENT_INVOICE_RECAP_EMAIL_VAT",
        template_id: 3,
        last_editor_tester_id: 1,
      },
      {
        id: 4,
        event_name: "PAYMENT_INVOICE_RECAP_EMAIL_COMPANY",
        template_id: 4,
        last_editor_tester_id: 1,
      },
    ]);

    await tryber.tables.FiscalCategory.do().insert([
      { id: 1, name: "withholding" },
      { id: 2, name: "witholding-extra" },
      { id: 3, name: "vat" },
      { id: 4, name: "non-italian" },
      { id: 5, name: "company" },
      { id: 6, name: "internal" },
    ]);
  });
  afterAll(async () => {
    process.env.PAYMENT_REQUESTED_EMAIL = oldEnv.PAYMENT_REQUESTED_EMAIL;
    process.env.PAYMENT_INVOICE_RECAP_EMAIL_WITHOLDING_EXTRA =
      oldEnv.PAYMENT_INVOICE_RECAP_EMAIL_WITHOLDING_EXTRA;
    process.env.PAYMENT_INVOICE_RECAP_EMAIL_VAT =
      oldEnv.PAYMENT_INVOICE_RECAP_EMAIL_VAT;
    process.env.PAYMENT_INVOICE_RECAP_EMAIL_COMPANY =
      oldEnv.PAYMENT_INVOICE_RECAP_EMAIL_COMPANY;
    await tryber.tables.FiscalCategory.do().delete();
    await tryber.tables.WpAppqUnlayerMailTemplate.do().delete();
    await tryber.tables.WpAppqEventTransactionalMail.do().delete();
  });
  beforeEach(async () => {
    jest.clearAllMocks();
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

  describe("POST /users/me/payments/ - fiscal profile 1", () => {
    beforeEach(async () => {
      await tryber.tables.WpAppqPayment.do().insert({
        tester_id: 1,
        amount: 100,
      });
      await tryber.tables.WpAppqFiscalProfile.do().insert(fiscalProfile);
    });
    afterEach(async () => {
      await tryber.tables.WpAppqPayment.do().truncate();
      await tryber.tables.WpAppqFiscalProfile.do().truncate();
    });

    it("Should send an email to PAYMENT_REQUESTED_EMAIL with the correct subject and body", async () => {
      const response = await request(app)
        .post("/users/me/payments")
        .send({
          method: {
            type: "paypal",
            email: "test@example.com",
          },
        })
        .set("Authorization", "Bearer tester");
      expect(mockedSendgrid.send).toHaveBeenCalledTimes(1);
      expect(mockedSendgrid.send).toHaveBeenCalledWith(
        expect.objectContaining({
          from: {
            email: "it@tryber.me",
            name: "Tryber",
          },
          html: expect.stringContaining("PAYMENT_REQUESTED_EMAIL_BODY"),
          subject: "[Tryber] Payout Request",
          categories: ["Test"],
        })
      );
      expect(response.status).toBe(200);
    });
    it("Should send an email with {Payment.address}", async () => {
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
      expect(mockedSendgrid.send).toHaveBeenCalledTimes(1);
      expect(mockedSendgrid.send).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("Via Lancia, 10, 20021 Milano (MI)"),
        })
      );
      expect(response.status).toBe(200);
    });
    it("Should send an email with {Payment.fiscalType}", async () => {
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
      expect(mockedSendgrid.send).toHaveBeenCalledTimes(1);
      expect(mockedSendgrid.send).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("withholding"),
        })
      );
      expect(response.status).toBe(200);
    });
    it("Should send an email with {Profile.identificationNumber}", async () => {
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
      expect(mockedSendgrid.send).toHaveBeenCalledTimes(1);
      expect(mockedSendgrid.send).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("BJD3FG7H2JK5JN9PQ"),
        })
      );
      expect(response.status).toBe(200);
    });
  });

  describe("POST /users/me/payments/ - fiscal profile 2", () => {
    beforeEach(async () => {
      await tryber.tables.WpAppqPayment.do().insert({
        tester_id: 1,
        amount: 100,
      });

      await tryber.tables.WpAppqFiscalProfile.do().insert({
        ...fiscalProfile,
        fiscal_category: 2,
      });
    });
    afterEach(async () => {
      await tryber.tables.WpAppqPayment.do().truncate();
      await tryber.tables.WpAppqFiscalProfile.do().truncate();
    });

    it("Should send an email to PAYMENT_INVOICE_RECAP_EMAIL with the correct subject and body", async () => {
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
      expect(mockedSendgrid.send).toHaveBeenCalledTimes(1);
      expect(mockedSendgrid.send).toHaveBeenCalledWith(
        expect.objectContaining({
          from: {
            email: "it@tryber.me",
            name: "Tryber",
          },
          html: expect.stringContaining(
            "PAYMENT_INVOICE_RECAP_EMAIL_WITHOLDING_EXTRA_BODY"
          ),
          subject: "[Tryber] Payout Request",
          categories: ["Test"],
        })
      );
      expect(response.status).toBe(200);
    });
    it("Should send an email with {Payment.grossINPS}", async () => {
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
      expect(mockedSendgrid.send).toHaveBeenCalledTimes(1);
      expect(mockedSendgrid.send).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("86.21"),
        })
      );
      expect(response.status).toBe(200);
    });
    it("Should send an email with {Payment.address}", async () => {
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
      expect(mockedSendgrid.send).toHaveBeenCalledTimes(1);
      expect(mockedSendgrid.send).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("Via Lancia, 10, 20021 Milano (MI)"),
        })
      );
      expect(response.status).toBe(200);
    });
    it("Should send an email with {Payment.fiscalType}", async () => {
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
      expect(mockedSendgrid.send).toHaveBeenCalledTimes(1);
      expect(mockedSendgrid.send).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("witholding-extra"),
        })
      );
      expect(response.status).toBe(200);
    });
    it("Should send an email with {Profile.identificationNumber}", async () => {
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
      expect(mockedSendgrid.send).toHaveBeenCalledTimes(1);
      expect(mockedSendgrid.send).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("BJD3FG7H2JK5JN9PQ"),
        })
      );
      expect(response.status).toBe(200);
    });
  });
  describe("POST /users/me/payments/ - fiscal profile 3", () => {
    beforeEach(async () => {
      await tryber.tables.WpAppqPayment.do().insert({
        tester_id: 1,
        amount: 100,
      });

      await tryber.tables.WpAppqFiscalProfile.do().insert({
        ...fiscalProfile,
        fiscal_category: 3,
      });
    });
    afterEach(async () => {
      await tryber.tables.WpAppqPayment.do().truncate();
      await tryber.tables.WpAppqFiscalProfile.do().truncate();
    });

    it("Should send an email to PAYMENT_INVOICE_RECAP_EMAIL with the correct subject and body", async () => {
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
      expect(mockedSendgrid.send).toHaveBeenCalledTimes(1);
      expect(mockedSendgrid.send).toHaveBeenCalledWith(
        expect.objectContaining({
          from: {
            email: "it@tryber.me",
            name: "Tryber",
          },
          html: expect.stringContaining("PAYMENT_INVOICE_RECAP_EMAIL_VAT_BODY"),
          subject: "[Tryber] Payout Request",
          categories: ["Test"],
        })
      );
      expect(response.status).toBe(200);
    });
    it("Should send an email with {Payment.address}", async () => {
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
      expect(mockedSendgrid.send).toHaveBeenCalledTimes(1);
      expect(mockedSendgrid.send).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("Via Lancia, 10, 20021 Milano (MI)"),
        })
      );
      expect(response.status).toBe(200);
    });
    it("Should send an email with {Payment.fiscalType}", async () => {
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
      expect(mockedSendgrid.send).toHaveBeenCalledTimes(1);
      expect(mockedSendgrid.send).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("vat"),
        })
      );
      expect(response.status).toBe(200);
    });
    it("Should send an email with {Profile.identificationNumber}", async () => {
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
      expect(mockedSendgrid.send).toHaveBeenCalledTimes(1);
      expect(mockedSendgrid.send).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("BJD3FG7H2JK5JN9PQ"),
        })
      );
      expect(response.status).toBe(200);
    });
  });

  describe("POST /users/me/payments/ - fiscal profile 4", () => {
    beforeEach(async () => {
      await tryber.tables.WpAppqPayment.do().insert({
        tester_id: 1,
        amount: 100,
      });

      await tryber.tables.WpAppqFiscalProfile.do().insert({
        ...fiscalProfile,
        fiscal_category: 4,
      });
    });
    afterEach(async () => {
      await tryber.tables.WpAppqPayment.do().truncate();
      await tryber.tables.WpAppqFiscalProfile.do().truncate();
    });

    it("Should send an email to PAYMENT_REQUESTED_EMAIL with the correct subject and body", async () => {
      const response = await request(app)
        .post("/users/me/payments")
        .send({
          method: {
            type: "paypal",
            email: "test@example.com",
          },
        })
        .set("Authorization", "Bearer tester");
      expect(mockedSendgrid.send).toHaveBeenCalledTimes(1);
      expect(mockedSendgrid.send).toHaveBeenCalledWith(
        expect.objectContaining({
          from: {
            email: "it@tryber.me",
            name: "Tryber",
          },
          html: expect.stringContaining("PAYMENT_REQUESTED_EMAIL_BODY"),
          subject: "[Tryber] Payout Request",
          categories: ["Test"],
        })
      );
      expect(response.status).toBe(200);
    });
    it("Should send an email with {Payment.address}", async () => {
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
      expect(mockedSendgrid.send).toHaveBeenCalledTimes(1);
      expect(mockedSendgrid.send).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("Via Lancia, 10, 20021 Milano (MI)"),
        })
      );
      expect(response.status).toBe(200);
    });
    it("Should send an email with {Payment.fiscalType}", async () => {
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
      expect(mockedSendgrid.send).toHaveBeenCalledTimes(1);
      expect(mockedSendgrid.send).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("non-italian"),
        })
      );
      expect(response.status).toBe(200);
    });
    it("Should send an email with {Profile.identificationNumber}", async () => {
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
      expect(mockedSendgrid.send).toHaveBeenCalledTimes(1);
      expect(mockedSendgrid.send).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("BJD3FG7H2JK5JN9PQ"),
        })
      );
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
        ...fiscalProfile,
        fiscal_category: 5,
      });
    });
    afterEach(async () => {
      await tryber.tables.WpAppqPayment.do().truncate();
      await tryber.tables.WpAppqFiscalProfile.do().truncate();
    });

    it("Should send an email to PAYMENT_INVOICE_RECAP_EMAIL with the correct subject and body", async () => {
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
      expect(mockedSendgrid.send).toHaveBeenCalledTimes(1);
      expect(mockedSendgrid.send).toHaveBeenCalledWith(
        expect.objectContaining({
          from: {
            email: "it@tryber.me",
            name: "Tryber",
          },
          html: expect.stringContaining(
            "PAYMENT_INVOICE_RECAP_EMAIL_COMPANY_BODY"
          ),
          subject: "[Tryber] Payout Request",
          categories: ["Test"],
        })
      );
      expect(response.status).toBe(200);
    });
    it("Should send an email with {Payment.address}", async () => {
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
      expect(mockedSendgrid.send).toHaveBeenCalledTimes(1);
      expect(mockedSendgrid.send).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("Via Lancia, 10, 20021 Milano (MI)"),
        })
      );
      expect(response.status).toBe(200);
    });
    it("Should send an email with {Payment.fiscalType}", async () => {
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
      expect(mockedSendgrid.send).toHaveBeenCalledTimes(1);
      expect(mockedSendgrid.send).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("company"),
        })
      );
      expect(response.status).toBe(200);
    });
    it("Should send an email with {Profile.identificationNumber}", async () => {
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
      expect(mockedSendgrid.send).toHaveBeenCalledTimes(1);
      expect(mockedSendgrid.send).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("BJD3FG7H2JK5JN9PQ"),
        })
      );
      expect(response.status).toBe(200);
    });
  });

  describe("POST /users/me/payments/ - fiscal profile 6", () => {
    beforeEach(async () => {
      await tryber.tables.WpAppqPayment.do().insert({
        tester_id: 1,
        amount: 100,
      });

      await tryber.tables.WpAppqFiscalProfile.do().insert({
        ...fiscalProfile,
        fiscal_category: 6,
      });
    });
    afterEach(async () => {
      await tryber.tables.WpAppqPayment.do().truncate();
      await tryber.tables.WpAppqFiscalProfile.do().truncate();
    });

    it("Should not send an email", async () => {
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
      expect(mockedSendgrid.send).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(200);
    });
  });

  describe("POST /users/me/payments - inactive fiscal profile", () => {
    beforeEach(async () => {
      await tryber.tables.WpAppqPayment.do().insert({
        tester_id: 1,
        amount: 69.99,
      });
      await tryber.tables.WpAppqFiscalProfile.do().insert({
        ...fiscalProfile,
        is_active: 0,
      });
    });

    afterEach(async () => {
      await tryber.tables.WpAppqPayment.do().delete();
      await tryber.tables.WpAppqFiscalProfile.do().truncate();
    });

    it("Should not send an email", async () => {
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
      expect(mockedSendgrid.send).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(403);
    });
  });

  describe("POST /users/me/payments - under threshold", () => {
    beforeEach(async () => {
      await tryber.tables.WpAppqPayment.do().insert({
        tester_id: 1,
        amount: 0.01,
      });
      await tryber.tables.WpAppqFiscalProfile.do().insert(fiscalProfile);
    });

    afterEach(async () => {
      await tryber.tables.WpAppqPayment.do().delete();
      await tryber.tables.WpAppqFiscalProfile.do().truncate();
    });

    it("Should not send an email", async () => {
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
      expect(mockedSendgrid.send).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(403);
    });
  });

  describe("POST /users/me/payments - processing payment", () => {
    beforeEach(async () => {
      await tryber.tables.WpAppqPayment.do().insert({
        tester_id: 1,
        amount: 10,
      });
      await tryber.tables.WpAppqFiscalProfile.do().insert(fiscalProfile);
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

    it("Should not send an email", async () => {
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
      expect(mockedSendgrid.send).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(403);
    });
  });
});
