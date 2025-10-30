import app from "@src/app";
import { tryber } from "@src/features/database";
import upload from "@src/features/upload";
import Candidature from "@src/__mocks__/mockedDb/cpHasCandidates";
import Profile from "@src/__mocks__/mockedDb/profile";
import WpOptions from "@src/__mocks__/mockedDb/wp_options";
import WpUsers from "@src/__mocks__/mockedDb/wp_users";
import request from "supertest";
import crypt from "./crypt";

jest.mock("@src/features/upload");
jest.mock("./crypt");

const mockFileBuffer = Buffer.from("some data");
process.env.OPTIMIZED_TASK_MEDIA_BUCKET = "optimized-task-bucket";
process.env.TASK_MEDIA_BUCKET = "task-bucket";
describe("Route POST /users/me/campaign/{campaignId}/media", () => {
  beforeAll(async () => {
    (upload as jest.Mock).mockImplementation(
      ({ key, bucket }: { bucket: string; key: string }) => {
        return `https://s3.amazonaws.com/${bucket}/${key}`;
      }
    );
    (crypt as jest.Mock).mockImplementation((string: string) => `crypted`);

    await tryber.tables.WpAppqEvdProfile.do().insert({
      id: 1,
      wp_user_id: 1,
      email: "",
      education_id: 1,
      employment_id: 1,
    });
    const task = {
      title: "Task",
      content: "",
      jf_code: "",
      jf_text: "",
      simple_title: "Task",
      info: "",
      prefix: "",
      is_required: 0,
      optimize_media: 0,
    };
    await tryber.tables.WpAppqCampaignTask.do().insert([
      {
        ...task,
        id: 1,
        campaign_id: 1,
      },
      {
        ...task,
        id: 2,
        campaign_id: 1,
        optimize_media: 1,
      },
      {
        ...task,
        id: 10,
        campaign_id: 10,
      },
    ]);
    await tryber.tables.WpUsers.do().insert({
      ID: 1,
    });

    await tryber.tables.WpOptions.do().insert({
      option_name: "options_appq_valid_upload_extensions",
      option_value: "jpg,mov,png",
    });
    await tryber.tables.WpCrowdAppqHasCandidate.do().insert({
      campaign_id: 1,
      user_id: 1,
      accepted: 1,
      selected_device: 1,
    });
  });
  afterAll(async () => {
    await WpUsers.clear();
    await Profile.clear();
    await WpOptions.clear();
    await Candidature.clear();
  });
  afterEach(async () => {
    await tryber.tables.WpAppqUserTaskMedia.do().delete();
    jest.clearAllMocks();
  });
  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).post(
      "/users/me/campaigns/1/tasks/1/media"
    );
    expect(response.status).toBe(403);
  });
  it("Should answer 200 if logged in and everything is fine", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/tasks/1/media")
      .attach("media", mockFileBuffer, "void.png")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
  });
  it("Should upload to s3 if logged in and everything is fine", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/tasks/1/media")
      .attach("media", mockFileBuffer, "void.png")
      .set("Authorization", "Bearer tester");
    expect(upload).toHaveBeenCalledTimes(1);
  });
  it("Should answer 403 if logged in but not selected in the campaign", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/10/tasks/10/media")
      .attach("media", mockFileBuffer, "void.png")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });
  it("Should answer 200 with error code INVALID_FILE_EXTENSION if the extension is not in the whitelist", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/tasks/1/media")
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
      .post("/users/me/campaigns/1/tasks/1/media")
      .attach("media", mockFileBuffer, "void.png")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("files");
    expect(response.body.files.length).toBe(1);
    expect(response.body.files[0]).toHaveProperty("path");
    expect(
      response.body.files[0].path.startsWith(
        "https://s3.amazonaws.com/task-bucket/CP1/UC1/T1/"
      )
    ).toBe(true);
  });
  it("Should insert on DB uploaded files", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/tasks/1/media")
      .attach("media", mockFileBuffer, "void.png")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    const insertedMedia = await tryber.tables.WpAppqUploadedMedia.do().select();
    expect(insertedMedia).not.toEqual(undefined);
    expect(insertedMedia[0].url).toEqual(response.body.files[0].path);
    if (insertedMedia[0].creation_date)
      expect(
        insertedMedia[0].creation_date.startsWith(
          new Date().toISOString().substring(0, 10)
        )
      ).toBe(true);
  });
  it("Should crypt the filename on s3", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/tasks/1/media")
      .attach("media", mockFileBuffer, "void.png")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("files");
    expect(response.body.files.length).toBe(1);
    expect(response.body.files[0]).toHaveProperty(
      "path",
      "https://s3.amazonaws.com/task-bucket/CP1/UC1/T1/crypted.png"
    );
  });
  it("Should upload to optimized bucket if media is optimized", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/tasks/2/media")
      .attach("media", mockFileBuffer, "void.png")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("files");
    expect(response.body.files.length).toBe(1);
    expect(response.body.files[0]).toHaveProperty(
      "path",
      "https://s3.amazonaws.com/optimized-task-bucket/CP1/UC2/T1/crypted.png"
    );
  });

  describe("Device Data Serialization", () => {
    describe("When the selected device doesnt exists", () => {
      it("Should serialize default data on media", async () => {
        const response = await request(app)
          .post("/users/me/campaigns/1/tasks/1/media")
          .attach("media", mockFileBuffer, "void.png")
          .set("Authorization", "Bearer tester");
        expect(response.status).toBe(200);
        const insertedMedia =
          await tryber.tables.WpAppqUserTaskMedia.do().select(
            "manufacturer",
            "model",
            "pc_type",
            "platform_id",
            "os_version_id",
            "form_factor"
          );

        expect(insertedMedia).not.toEqual(undefined);
        expect(insertedMedia[0].manufacturer).toEqual("Unknown");
        expect(insertedMedia[0].model).toEqual("Unknown");
        expect(insertedMedia[0].pc_type).toEqual("Unknown");
        expect(insertedMedia[0].platform_id).toEqual(0);
        expect(insertedMedia[0].os_version_id).toEqual(0);
        expect(insertedMedia[0].form_factor).toEqual("Unknown");
      });
    });
    describe("When the selected device exists", () => {
      beforeAll(async () => {
        await tryber.tables.WpCrowdAppqDevice.do().insert({
          id: 1,
          id_profile: 1,
          manufacturer: "Test Manufacturer",
          model: "Test Model",
          pc_type: "Test PC Type",
          platform_id: 10,
          os_version_id: 100,
          form_factor: "Test Form Factor",
        });
      });
      afterAll(async () => {
        await tryber.tables.WpCrowdAppqDevice.do().delete();
      });

      it("Should serialize the device data on media", async () => {
        const response = await request(app)
          .post("/users/me/campaigns/1/tasks/1/media")
          .attach("media", mockFileBuffer, "void.png")
          .set("Authorization", "Bearer tester");
        expect(response.status).toBe(200);
        const insertedMedia =
          await tryber.tables.WpAppqUserTaskMedia.do().select(
            "manufacturer",
            "model",
            "pc_type",
            "platform_id",
            "os_version_id",
            "form_factor"
          );

        expect(insertedMedia).not.toEqual(undefined);
        expect(insertedMedia[0].manufacturer).toEqual("Test Manufacturer");
        expect(insertedMedia[0].model).toEqual("Test Model");
        expect(insertedMedia[0].pc_type).toEqual("Test PC Type");
        expect(insertedMedia[0].platform_id).toEqual(10);
        expect(insertedMedia[0].os_version_id).toEqual(100);
        expect(insertedMedia[0].form_factor).toEqual("Test Form Factor");
      });
    });
  });
});
