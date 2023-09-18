import app from "@src/app";
import request from "supertest";
import { tryber } from "@src/features/database";

const profile = {
  id: 1,
  wp_user_id: 1,
  name: "Jhon",
  surname: "Doe",
  birth_date: "1990-01-01",
  phone_number: "123456789",
  city: "Milan",
  address: "Via Roma 1",
  country: "Italy",
  postal_code: 12345,
  email: "jhondoe@tryber.me",
  employment_id: 1,
  education_id: 1,
  last_login: new Date().toISOString().slice(0, 19).replace("T", " "),
  last_activity: new Date().toISOString().slice(0, 19).replace("T", " "),
  sex: 1,
  is_verified: 1,
  total_exp_pts: 9000,
  onboarding_complete: 1,
};

describe("GET /users/me - booties", () => {
  beforeEach(async () => {
    await tryber.tables.WpAppqEvdProfile.do().insert(profile);
    await tryber.tables.WpUsers.do().insert({ ID: 1, user_login: "jhon.doe" });
  });
  afterEach(async () => {
    await tryber.tables.WpAppqEvdProfile.do().delete();
    await tryber.tables.WpUsers.do().delete();
  });

  describe("GET /users/me - booty and pending_booty, fiscal profile and Earnings < 5000 - fiscal_category = 1", () => {
    beforeEach(async () => {
      await tryber.tables.WpAppqFiscalProfile.do().insert({
        id: 1,
        tester_id: 1,
        name: profile.name,
        surname: profile.surname,
        sex: profile.sex.toString(),
        birth_date: profile.birth_date,
        is_active: 1,
        is_verified: 1,
        fiscal_category: 1,
      });
      await tryber.tables.WpAppqPaymentRequest.do().insert([
        {
          id: 1,
          tester_id: 1,
          amount: 1000.25,
          amount_gross: 1250.25, // 25% withholding tax if <5000
          is_paid: 1,
          paypal_email: profile.email,
          update_date: "1979-05-03 00:00:00",
          under_threshold: 5,
          withholding_tax_percentage: 25,
        },
        {
          id: 2,
          tester_id: 1,
          amount: 2000,
          amount_gross: 2500, // 25% withholding tax if <5000
          is_paid: 1,
          paypal_email: profile.email,
          update_date: "1979-05-03 00:00:00",
          under_threshold: 5,
          withholding_tax_percentage: 25,
        },
        {
          id: 3,
          tester_id: 1,
          amount: 2000,
          amount_gross: 2500,
          is_paid: 0,
          paypal_email: profile.email,
          update_date: "1979-05-03 00:00:00",
          under_threshold: 5,
          withholding_tax_percentage: 25,
        },
      ]);
      await tryber.tables.WpAppqPayment.do().insert([
        { id: 1, tester_id: 1, amount: 1000, is_paid: 0, is_requested: 0 },
        { id: 2, tester_id: 1, amount: 1000, is_paid: 0, is_requested: 0 },
        { id: 3, tester_id: 1, amount: 1000, is_paid: 0, is_requested: 1 },
      ]);
    });
    afterEach(async () => {
      await tryber.tables.WpAppqFiscalProfile.do().delete();
      await tryber.tables.WpAppqPaymentRequest.do().delete();
      await tryber.tables.WpAppqPayment.do().delete();
    });
    it("Should return booty as net and gross", async () => {
      const response = await request(app)
        .get("/users/me?fields=booty")
        .set("authorization", "Bearer tester");
      expect(response.body.booty).toBeDefined();
      expect(response.body.booty).toEqual({
        net: { value: 3000.25, currency: "EUR" },
        gross: { value: 3750.25, currency: "EUR" },
      });
    });
    it("Should return total of unrequested attributions if parameter fields=pending_booty as net and gorss", async () => {
      const response = await request(app)
        .get("/users/me?fields=pending_booty")
        .set("authorization", "Bearer tester");
      expect(response.body.pending_booty).toBeDefined();
      expect(response.body.pending_booty).toEqual({
        gross: { value: 2000, currency: "EUR" },
        net: { value: 1600, currency: "EUR" }, // 20% withholding tax if <5000
      });
    });
  });
  describe("GET /users/me - booty and pending_booty fiscal profile category !== 1", () => {
    beforeEach(async () => {
      await tryber.tables.WpAppqFiscalProfile.do().insert({
        id: 1,
        tester_id: 1,
        name: profile.name,
        surname: profile.surname,
        sex: profile.sex.toString(),
        birth_date: profile.birth_date,
        is_active: 1,
        is_verified: 1,
        fiscal_category: 2,
      });
      await tryber.tables.WpAppqPaymentRequest.do().insert([
        {
          id: 1,
          tester_id: 1,
          amount: 1000.25,
          amount_gross: 1250.25, // 25% withholding tax if <5000
          is_paid: 1,
          paypal_email: profile.email,
          update_date: "1979-05-03 00:00:00",
          under_threshold: 5,
          withholding_tax_percentage: 25,
        },
        {
          id: 2,
          tester_id: 1,
          amount: 2000,
          amount_gross: 2500, // 25% withholding tax if <5000
          is_paid: 1,
          paypal_email: profile.email,
          update_date: "1979-05-03 00:00:00",
          under_threshold: 5,
          withholding_tax_percentage: 25,
        },
        {
          id: 3,
          tester_id: 1,
          amount: 2000,
          amount_gross: 2500,
          is_paid: 0,
          paypal_email: profile.email,
          update_date: "1979-05-03 00:00:00",
          under_threshold: 5,
          withholding_tax_percentage: 25,
        },
      ]);
      await tryber.tables.WpAppqPayment.do().insert([
        { id: 1, tester_id: 1, amount: 1000, is_paid: 0, is_requested: 0 },
        { id: 2, tester_id: 1, amount: 1000, is_paid: 0, is_requested: 0 },
        { id: 3, tester_id: 1, amount: 1000, is_paid: 0, is_requested: 1 },
      ]);
    });
    afterEach(async () => {
      await tryber.tables.WpAppqFiscalProfile.do().delete();
      await tryber.tables.WpAppqPaymentRequest.do().delete();
      await tryber.tables.WpAppqPayment.do().delete();
    });

    it("Should return booty gross", async () => {
      const response = await request(app)
        .get("/users/me?fields=booty")
        .set("authorization", "Bearer tester");
      expect(response.body.booty).toBeDefined();
      expect(response.body.booty).toEqual({
        gross: { value: 3750.25, currency: "EUR" },
      });
      expect(response.body.booty).not.toHaveProperty("net");
    });
    it("Should return total of unrequested attributions if parameter fields=pending_booty as gorss", async () => {
      const response = await request(app)
        .get("/users/me?fields=pending_booty")
        .set("authorization", "Bearer tester");
      expect(response.body.pending_booty).toBeDefined();
      expect(response.body.pending_booty).toEqual({
        gross: { value: 2000, currency: "EUR" },
      });
      expect(response.body.pending_booty).not.toHaveProperty("net");
    });
  });
  describe("GET /users/me - booty and pending_booty, no paid requests", () => {
    beforeEach(async () => {
      await tryber.tables.WpAppqFiscalProfile.do().insert([
        {
          id: 1,
          tester_id: 1,
          name: profile.name,
          surname: profile.surname,
          sex: profile.sex.toString(),
          birth_date: profile.birth_date,
          is_active: 1,
          is_verified: 1,
          fiscal_category: 2,
        },
      ]);
      await tryber.tables.WpAppqPaymentRequest.do().insert([
        {
          id: 1,
          tester_id: 1,
          amount: 1000.25,
          amount_gross: 1250.25, // 25% withholding tax if <5000
          is_paid: 0,
          paypal_email: profile.email,
          update_date: "1979-05-03 00:00:00",
          under_threshold: 5,
          withholding_tax_percentage: 25,
        },
        {
          id: 2,
          tester_id: 1,
          amount: 2000,
          amount_gross: 2500, // 25% withholding tax if <5000
          is_paid: 0,
          paypal_email: profile.email,
          update_date: "1979-05-03 00:00:00",
          under_threshold: 5,
          withholding_tax_percentage: 25,
        },
      ]);
      await tryber.tables.WpAppqPayment.do().insert([
        { id: 1, tester_id: 1, amount: 1000, is_paid: 0, is_requested: 1 },
      ]);
    });
    afterEach(async () => {
      await tryber.tables.WpAppqFiscalProfile.do().delete();
      await tryber.tables.WpAppqPaymentRequest.do().delete();
      await tryber.tables.WpAppqPayment.do().delete();
    });

    it("Should return booty gross", async () => {
      const response = await request(app)
        .get("/users/me?fields=booty")
        .set("authorization", "Bearer tester");

      expect(response.body.booty).toBeDefined();
      expect(response.body.booty).toEqual({
        gross: { value: 0, currency: "EUR" },
      });
      expect(response.body.booty).not.toHaveProperty("net");
    });
    it("Should return pending_booty gross as 0 if all attributions are requested", async () => {
      const response = await request(app)
        .get("/users/me?fields=pending_booty")
        .set("authorization", "Bearer tester");

      expect(response.body.pending_booty).toBeDefined();
      expect(response.body.pending_booty).toEqual({
        gross: { value: 0, currency: "EUR" },
      });
      expect(response.body.pending_booty).not.toHaveProperty("net");
    });
  });
  describe("GET /users/me - pending_booty threshold", () => {
    const data: any = {};
    beforeEach(async () => {
      await tryber.tables.WpOptions.do().insert({
        option_id: 1,
        option_name: "crowd_options_option_name",
        option_value:
          'a:17:{s:11:"facebook_id";s:3:"asd";s:20:"facebook_secret_code";s:3:"asd";s:11:"linkedin_id";s:3:"asd";s:20:"linkedin_secret_code";s:3:"asd";s:15:"paypal_live_env";s:15:"paypal_live_env";s:16:"paypal_client_id";s:3:"asd";s:18:"paypal_secret_code";s:3:"asd";s:22:"transfer_wise_live_env";s:22:"transfer_wise_live_env";s:25:"transfer_wise_secret_code";s:3:"asd";s:14:"analitycs_code";s:0:"";s:14:"minimum_payout";s:1:"2";s:13:"appq_cm_email";s:13:"a@example.com";s:9:"adv_email";s:13:"a@example.com";s:11:"adv_project";s:2:"59";s:21:"italian_payment_check";s:21:"italian_payment_check";s:15:"stamp_threshold";s:5:"77.47";s:15:"release_message";s:2:"[]";}',
      });
    });
    afterEach(async () => {
      await tryber.tables.WpOptions.do().delete();
      await tryber.tables.WpAppqPayment.do().delete();
    });
    it("Should return booty threshold.isOver=false if pending booty < threshold", async () => {
      await tryber.tables.WpAppqPayment.do().insert([
        {
          id: 1,
          amount: 15,
          tester_id: 1,
          is_requested: 1,
        },
        {
          id: 2,
          amount: 15,
          tester_id: 2,
          is_requested: 0,
        },
      ]);
      const response = await request(app)
        .get("/users/me?fields=booty_threshold")
        .set("authorization", "Bearer tester");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("booty_threshold");
      expect(response.body.booty_threshold).toEqual({
        value: 2,
        isOver: false,
      });
    });
    it("Should return booty threshold.isOver=true if pending booty > threshold", async () => {
      await tryber.tables.WpAppqPayment.do().insert([
        {
          id: 1,
          amount: 15,
          tester_id: 1,
          is_requested: 0,
        },
      ]);
      const response = await request(app)
        .get("/users/me?fields=booty_threshold")
        .set("authorization", "Bearer tester");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("booty_threshold");
      expect(response.body.booty_threshold).toEqual({
        value: 2,
        isOver: true,
      });
    });
  });
});
