import app from "@src/app";
import upload from "@src/features/upload";
import Candidature from "@src/__mocks__/mockedDb/cp_has_candidates";
import { data as profileData } from "@src/__mocks__/mockedDb/profile";
import WpOptions from "@src/__mocks__/mockedDb/wp_options";
import { data as wpUserData } from "@src/__mocks__/mockedDb/wp_users";
import request from "supertest";

jest.mock("@src/features/upload");

const mockFileBuffer = Buffer.from("some data");
describe("Route POST /users/me/campaign/{campaignId}/media", () => {
  beforeAll(async () => {
    (upload as jest.Mock).mockImplementation(
      ({ key, bucket }: { bucket: string; key: string }) => {
        return `https://s3.amazonaws.com/${bucket}/${key}`;
      }
    );
    await profileData.basicTester();
    await wpUserData.basicUser();
    await WpOptions.validUploadExtensions(["jpg", "mov", "png"]);
    await Candidature.insert({ campaign_id: 1, user_id: 1 });
  });
  afterAll(async () => {
    await wpUserData.drop();
    await profileData.drop();
    await WpOptions.clear();
    await Candidature.clear();
  });
  afterEach(async () => {
    jest.clearAllMocks();
  });
  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).post("/users/me/campaigns/1/media");
    expect(response.status).toBe(403);
  });
  it("Should answer 200 if logged in and everything is fine", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/media")
      .attach("media", mockFileBuffer, "void.png")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
  });
  it("Should upload to s3 if logged in and everything is fine", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/media")
      .attach("media", mockFileBuffer, "void.png")
      .set("Authorization", "Bearer tester");
    expect(upload).toHaveBeenCalledTimes(1);
  });
  it("Should answer 403 if logged in but not selected in the campaign", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/10/media")
      .attach("media", mockFileBuffer, "void.png")
      .set("Authorization", "Bearer tester");
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
      { name: "void.bat" },
      { name: "void.sh" },
      { name: "void.exe" },
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

    expect(response.body).toHaveProperty("failed", [{ name: "oversized.png" }]);
  });

  it("Should answer 200 with error code NOT_VALID_FILE_TYPE if the extension is not in the whitelist", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/media")
      .attach("media", mockFileBuffer, "void.ext")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("failed");
    expect(response.body.failed.length).toBe(1);
    expect(response.body.failed[0]).toMatchObject({
      code: "NOT_VALID_FILE_TYPE",
    });
  });

  it("Should add the campaign id to the path on s3", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/media")
      .attach("media", mockFileBuffer, "void.png")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("files");
    expect(response.body.files.length).toBe(1);
    expect(response.body.files[0]).toHaveProperty("path");
    expect(
      response.body.files[0].path.startsWith(
        "https://s3.amazonaws.com/tryber.media.staging/media/T1/CP1/"
      )
    ).toBe(true);
  });
});
