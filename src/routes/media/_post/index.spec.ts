import app from "@src/app";
import upload from "@src/features/upload";
import { data as profileData } from "@src/__mocks__/mockedDb/profile";
import { data as wpUserData } from "@src/__mocks__/mockedDb/wp_users";
import request from "supertest";

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
  it("Should answer 200 and mark as failed if try to send file as .bat, .sh and .exe", async () => {
    const mockFileBuffer = Buffer.from("some data");

    const response = await request(app)
      .post("/media")
      .attach("media", mockFileBuffer, "void.bat")
      .attach("media", mockFileBuffer, "image.png")
      .attach("media", mockFileBuffer, "void.sh")
      .attach("media", mockFileBuffer, "void.exe")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("failed", [
      { errorCode: "INVALID_FILE_EXTENSION", name: "void.bat" },
      { errorCode: "INVALID_FILE_EXTENSION", name: "void.sh" },
      { errorCode: "INVALID_FILE_EXTENSION", name: "void.exe" },
    ]);
  });
  it("Should answer 200 and mark as failed if try to send an oversized file", async () => {
    process.env.MAX_FILE_SIZE = "100";
    // a buffer with size of 101 bytes
    const mockFileBuffer = Buffer.alloc(101);

    const response = await request(app)
      .post("/media")
      .attach("media", mockFileBuffer, "oversized.png")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);

    expect(response.body).toHaveProperty("failed", [
      { errorCode: "FILE_TOO_BIG", name: "oversized.png" },
    ]);
  });
});
