import app from "@src/app";
import sqlite3 from "@src/features/sqlite";
import { data as testerCertificationData } from "@src/__mocks__/mockedDb/testerCertification";
import request from "supertest";

jest.mock("@src/features/db");
jest.mock("@appquality/wp-auth");
const cert1 = {
  id: 1,
  cert_id: 1,
  tester_id: 1,
};

describe("Route DELETE single-certification", () => {
  beforeEach(async () => {
    return new Promise(async (resolve) => {
      await sqlite3.insert("wp_appq_profile_certifications", cert1);

      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      await testerCertificationData.drop();

      resolve(null);
    });
  });

  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).delete("/users/me/certifications/1");
    expect(response.status).toBe(403);
  });
  it("Should answer a message on successfully removing", async () => {
    const response = await request(app)
      .delete("/users/me/certifications/1")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe("Certification successfully removed");
  });
});
