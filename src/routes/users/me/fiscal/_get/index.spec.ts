import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

const fiscalProfile = {
  tester_id: 1,
  fiscal_id: "JHNDOE90A01H501A",
  name: "Jhon",
  surname: "Doe",
  sex: "1",
  birth_date: "1990-01-01",
  city: "Milan",
  country: "Italy",
  province: "MI",
  address: "Dante Alighieri",
  address_number: "69",
  postal_code: "20123",
  birth_city: "Rome",
  birth_province: "RM",
  is_verified: 1,
  is_active: 1,
};
describe("GET /users/me/fiscal", () => {
  beforeAll(async () => {
    await tryber.tables.FiscalCategory.do().insert([
      { id: 1, name: "withholding", description: "Ritenuta, meno di 5k" },
      { id: 2, name: "witholding-extra", description: "Ritenuta, più di 5k" },
      { id: 3, name: "vat", description: "IVA forfettaria" },
      { id: 4, name: "non-italian", description: "Non residente in italia" },
      { id: 5, name: "company", description: "IVA ordinaria" },
      { id: 6, name: "internal", description: "Dipendente interno" },
    ]);
    await tryber.tables.WpAppqEvdProfile.do().insert({
      id: 1,
      wp_user_id: 1,
      name: "Jhon",
      surname: "Doe",
      email: "jhon.doe@unguess.io",
      employment_id: 1,
      education_id: 1,
      sex: 1,
    });
  });
  afterAll(async () => {
    await tryber.tables.FiscalCategory.do().delete();
    await tryber.tables.WpAppqEvdProfile.do().delete();
  });
  describe("Fiscal category 1", () => {
    beforeAll(async () => {
      await tryber.tables.WpAppqFiscalProfile.do().insert([
        {
          ...fiscalProfile,
          fiscal_category: 1,
          is_active: 0,
        },
        { ...fiscalProfile, fiscal_category: 1, tester_id: 2, is_active: 1 },
        {
          ...fiscalProfile,
          fiscal_category: 1,
        },
      ]);
    });
    afterAll(async () => {
      await tryber.tables.WpAppqFiscalProfile.do().delete();
    });
    it("Should answer 403 if not logged in", () => {
      return request(app).get("/users/me/fiscal").expect(403);
    });
    it("Should answer 200 if logged as user", async () => {
      const response = await request(app)
        .get("/users/me/fiscal")
        .set("Authorization", "Bearer tester");
      expect(response.status).toBe(200);
    });
    it("Should return fiscal category", async () => {
      const response = await request(app)
        .get("/users/me/fiscal")
        .set("Authorization", "Bearer tester");
      console.log(response.body);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("type", "withholding");
    });
    it("Should return address", async () => {
      const response = await request(app)
        .get("/users/me/fiscal")
        .set("Authorization", "Bearer tester");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("address", {
        country: "Italy",
        province: "MI",
        city: "Milan",
        street: "Dante Alighieri",
        streetNumber: "69",
        cityCode: "20123",
      });
    });
    it("Should return birthPlace", async () => {
      const response = await request(app)
        .get("/users/me/fiscal")
        .set("Authorization", "Bearer tester");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("birthPlace", {
        province: "RM",
        city: "Rome",
      });
    });
    it("Should return fiscalId", async () => {
      const response = await request(app)
        .get("/users/me/fiscal")
        .set("Authorization", "Bearer tester");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("fiscalId", "JHNDOE90A01H501A");
    });
    it("Should return fiscalStatus", async () => {
      const response = await request(app)
        .get("/users/me/fiscal")
        .set("Authorization", "Bearer tester");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("fiscalStatus", "Verified");
    });
    it("Should return gender", async () => {
      const response = await request(app)
        .get("/users/me/fiscal")
        .set("Authorization", "Bearer tester");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("gender", "male");
    });
  });
  describe("Fiscal category 2", () => {
    beforeAll(async () => {
      await tryber.tables.WpAppqFiscalProfile.do().insert({
        ...fiscalProfile,
        fiscal_category: 2,
      });
    });
    afterAll(async () => {
      await tryber.tables.WpAppqFiscalProfile.do().delete();
    });

    it("Should return fiscal category", async () => {
      const response = await request(app)
        .get("/users/me/fiscal")
        .set("Authorization", "Bearer tester");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("type", "witholding-extra");
    });
  });

  describe("Fiscal category 3", () => {
    beforeAll(async () => {
      await tryber.tables.WpAppqFiscalProfile.do().insert({
        ...fiscalProfile,
        fiscal_category: 3,
      });
    });
    afterAll(async () => {
      await tryber.tables.WpAppqFiscalProfile.do().delete();
    });

    it("Should return fiscal category", async () => {
      const response = await request(app)
        .get("/users/me/fiscal")
        .set("Authorization", "Bearer tester");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("type", "vat");
    });
  });

  describe("Fiscal category 4", () => {
    beforeAll(async () => {
      await tryber.tables.WpAppqFiscalProfile.do().insert({
        ...fiscalProfile,
        fiscal_category: 4,
      });
    });
    afterAll(async () => {
      await tryber.tables.WpAppqFiscalProfile.do().delete();
    });
    it("Should return fiscal category", async () => {
      const response = await request(app)
        .get("/users/me/fiscal")
        .set("Authorization", "Bearer tester");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("type", "non-italian");
    });
  });
  describe("Fiscal category 5", () => {
    beforeAll(async () => {
      await tryber.tables.WpAppqFiscalProfile.do().insert({
        ...fiscalProfile,
        fiscal_category: 5,
      });
    });
    afterAll(async () => {
      await tryber.tables.WpAppqFiscalProfile.do().delete();
    });
    it("Should return fiscal category", async () => {
      const response = await request(app)
        .get("/users/me/fiscal")
        .set("Authorization", "Bearer tester");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("type", "company");
    });
  });
  describe("Fiscal category 6", () => {
    beforeAll(async () => {
      await tryber.tables.WpAppqFiscalProfile.do().insert({
        ...fiscalProfile,
        fiscal_category: 6,
      });
    });
    afterAll(async () => {
      await tryber.tables.WpAppqFiscalProfile.do().delete();
    });
    it("Should return fiscal category", async () => {
      const response = await request(app)
        .get("/users/me/fiscal")
        .set("Authorization", "Bearer tester");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("type", "internal");
    });
  });
});
