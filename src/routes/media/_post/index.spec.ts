import app from "@src/app";
import upload from "@src/features/upload";
import { data as profileData } from "@src/__mocks__/mockedDb/profile";
import { data as wpUserData } from "@src/__mocks__/mockedDb/wp_users";
import request from "supertest";

jest.mock("@src/features/db");
jest.mock("@appquality/wp-auth");
jest.mock("@src/features/upload");

describe("Route POST /media", () => {
  beforeAll(async () => {
    (upload as jest.Mock).mockImplementation(
      ({ key, bucket }: { bucket: string; key: string }) => {
        return `https://s3.amazonaws.com/${bucket}/${key}`;
      }
    );
    return new Promise(async (resolve) => {
      await profileData.basicTester();
      await wpUserData.basicUser();
      resolve(null);
    });
  });
  afterAll(async () => {
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
  it("Should answer 200 if try to send file as .bat, .sh and .exe", async () => {
    const response = await request(app)
      .post("/media")
      .attach("media", "./src/__mocks__/exampleFiles/void.bat")
      .attach("media", "./src/__mocks__/exampleFiles/image.png")
      .attach("media", "./src/__mocks__/exampleFiles/void.sh")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("failed", [
      { name: "void.bat" },
      { name: "void.sh" },
    ]);
  });
});
