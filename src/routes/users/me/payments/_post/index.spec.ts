import {
  data as fiscalProfileData,
  table as fiscalProfileTable,
} from "@src/__mocks__/mockedDb/fiscalProfile";
import {
  data as profileData,
  table as profileTable,
} from "@src/__mocks__/mockedDb/profile";
import {
  data as wpOptionsData,
  table as wpOptionsTable,
} from "@src/__mocks__/mockedDb/wp_options";
import app from "@src/app";
import request from "supertest";

jest.mock("@src/features/db");
jest.mock("@appquality/wp-auth");

describe("POST /users/me/payments", () => {
  beforeEach(async () => {
    return new Promise(async (resolve) => {
      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      resolve(null);
    });
  });

  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).post("/users/me/payments");
    expect(response.status).toBe(403);
  });
});

describe("POST /users/me/payments - invalid data", () => {
  beforeEach(async () => {
    return new Promise(async (resolve) => {
      profileTable.create();
      fiscalProfileTable.create();
      wpOptionsTable.create();
      wpOptionsData.crowdWpOptions();
      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      profileTable.drop();
      fiscalProfileTable.drop();
      wpOptionsTable.drop();
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
});
