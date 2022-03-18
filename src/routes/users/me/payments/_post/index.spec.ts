import app from "@src/app";
import {
  data as profileData,
  table as profileTable,
} from "@src/__mocks__/mockedDb/profile";
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

describe("POST /users/me/payments", () => {
  beforeEach(async () => {
    return new Promise(async (resolve) => {
      profileTable.create();
      profileData.testerWithoutBooty();
      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      profileTable.drop();
      resolve(null);
    });
  });

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
