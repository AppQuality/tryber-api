import app from "@src/app";
import { tryber } from "@src/features/database";
import upload from "@src/features/upload";
import request from "supertest";

jest.mock("@src/features/upload");

const profile = {
  id: 1,
  wp_user_id: 1,
  email: "tester@example.com",
  employment_id: 1,
  education_id: 1,
};
const wpUser = {
  ID: 1,
  user_login: "tester",
  user_email: "tester@example.com",
  user_pass: "pass",
};
const campaign = {
  id: 1,
  title: "Test Campaign",
  customer_title: "Test Campaign",
  start_date: "2020-01-01",
  end_date: "2020-01-01",
  pm_id: 1,
  page_manual_id: 0,
  page_preview_id: 0,
  platform_id: 1,
  customer_id: 1,
  project_id: 1,
};

const campaign2 = {
  ...campaign,
  id: 2,
};

describe("Route POST /campaigns/{campaignId}/finance/attachments", () => {
  beforeAll(async () => {
    (upload as jest.Mock).mockImplementation(
      ({ key, bucket }: { bucket: string; key: string }) => {
        return `https://s3.amazonaws.com/${bucket}/${key}`;
      }
    );
    await tryber.tables.WpUsers.do().insert(wpUser);
    await tryber.tables.WpAppqEvdProfile.do().insert(profile);
    await tryber.tables.WpAppqEvdCampaign.do().insert([campaign, campaign2]);
  });

  afterAll(async () => {
    await tryber.tables.WpUsers.do().delete();
    await tryber.tables.WpAppqEvdProfile.do().delete();
    await tryber.tables.WpAppqEvdCampaign.do().delete();
  });

  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).post(
      "/campaigns/1/finance/attachments"
    );
    expect(response.status).toBe(403);
  });

  it("Should answer 200 and mark as failed if try to send file as .bat, .sh and .exe", async () => {
    const mockFileBuffer = Buffer.from("some data");

    const response = await request(app)
      .post("/campaigns/1/finance/attachments")
      .attach("media", mockFileBuffer, "void.bat")
      .attach("media", mockFileBuffer, "image.png")
      .attach("media", mockFileBuffer, "void.sh")
      .attach("media", mockFileBuffer, "void.exe")
      .set("authorization", 'Bearer tester olp {"appq_campaign":[1]}');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("failed", [
      { path: "INVALID_FILE_EXTENSION", name: "void.bat" },
      { path: "INVALID_FILE_EXTENSION", name: "void.sh" },
      { path: "INVALID_FILE_EXTENSION", name: "void.exe" },
    ]);
  });

  it("Should answer 200 and mark as failed if try to send an oversized file", async () => {
    process.env.MAX_FILE_SIZE = "100";
    const mockFileBuffer = Buffer.alloc(101);

    const response = await request(app)
      .post("/campaigns/1/finance/attachments")
      .attach("media", mockFileBuffer, "oversized.png")
      .set("authorization", 'Bearer tester olp {"appq_campaign":[1]}');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("failed", [
      { path: "FILE_TOO_BIG", name: "oversized.png" },
    ]);
  });
});
