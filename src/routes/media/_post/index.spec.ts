import { data as profileData } from "@src/__mocks__/mockedDb/profile";
import { data as wpUserData } from "@src/__mocks__/mockedDb/wp_users";
import app from "@src/app";
import request from "supertest";

jest.mock("@src/features/db");
jest.mock("@appquality/wp-auth");

describe("Route POST /media", () => {
  beforeEach(async () => {
    return new Promise(async (resolve) => {
      await profileData.basicTester();
      await wpUserData.basicUser();
      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve, reject) => {
      try {
        await wpUserData.drop();
        await profileData.drop();
        resolve(null);
      } catch (err) {
        reject(err);
      }
    });
  });
  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).post("/media");
    expect(response.status).toBe(403);
  });
  it("Should answer 404 if try to send file as .bat, .sh and .exe", async () => {
    const response = await request(app)
      .post("/media")
      .attach("media", "./src/__mocks__/exampleFiles/void.bat")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(404);
  });
});
