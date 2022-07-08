import app from "@src/app";
import upload from "@src/features/upload";
import Candidature from "@src/__mocks__/mockedDb/cpHasCandidates";
import { data as profileData } from "@src/__mocks__/mockedDb/profile";
import WpOptions from "@src/__mocks__/mockedDb/wp_options";
import { data as wpUserData } from "@src/__mocks__/mockedDb/wp_users";
import UploadedMedia from "@src/__mocks__/mockedDb/uploadedMedia";
import request from "supertest";
import crypt from "./crypt";

jest.mock("@src/features/upload");
jest.mock("./crypt");

const mockFileBuffer = Buffer.from("some data");
process.env.MEDIA_BUCKET = "tryber.media.staging";
process.env.MEDIA_FOLDER = "media";
describe("Route POST /users/me/campaign/{campaignId}/media", () => {
  beforeAll(async () => {
    (upload as jest.Mock).mockImplementation(
      ({ key, bucket }: { bucket: string; key: string }) => {
        return `https://s3.amazonaws.com/${bucket}/${key}`;
      }
    );
    (crypt as jest.Mock).mockImplementation((string: string) => `crypted`);
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
    await UploadedMedia.clear();
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

  it("Should answer 200 with error code INVALID_FILE_EXTENSION if the extension is not in the whitelist", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/media")
      .attach("media", mockFileBuffer, "void.ext")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("failed");
    expect(response.body.failed.length).toBe(1);
    expect(response.body.failed[0]).toMatchObject({
      errorCode: "INVALID_FILE_EXTENSION",
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
        "https://s3.amazonaws.com/tryber.media.staging/media/T1/CP1/bugs/"
      )
    ).toBe(true);
  });
  it("Should insert on DB uploaded files", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/media")
      .attach("media", mockFileBuffer, "void.png")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    const insertedMedia = await UploadedMedia.all();
    expect(insertedMedia).not.toEqual(undefined);
    expect(insertedMedia[0].url).toEqual(response.body.files[0].path);
    console.log(insertedMedia[0].creation_date);
    if (insertedMedia[0].creation_date)
      expect(
        insertedMedia[0].creation_date.startsWith(
          new Date().toISOString().substring(0, 10)
        )
      ).toBe(true);
  });
  it("Should crypt the filename on s3", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/media")
      .attach("media", mockFileBuffer, "void.png")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("files");
    expect(response.body.files.length).toBe(1);
    expect(response.body.files[0]).toHaveProperty(
      "path",
      "https://s3.amazonaws.com/tryber.media.staging/media/T1/CP1/bugs/crypted.png"
    );
  });
});
