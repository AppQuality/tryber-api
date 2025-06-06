import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

describe("PATCH /bugs/{BugId}/status", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdBugStatus.do().insert([
      {
        id: 1,
        name: "Refused",
      },
      {
        id: 2,
        name: "Approved",
      },
      {
        id: 3,
        name: "Pending",
      },
      {
        id: 4,
        name: "Need Review",
      },
    ]);

    await tryber.tables.WpAppqEvdBug.do().insert([
      {
        id: 10,
        description: "Bug 1",
        status_id: 1,
        campaign_id: 10,
        wp_user_id: 1,
        profile_id: 1,
        reviewer: 11111,
        last_editor_id: 11111,
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdBugStatus.do().delete();
    await tryber.tables.WpAppqEvdBug.do().delete();
  });

  it("Should answer 403 if not logged in", async () => {
    const response = await request(app)
      .patch("/bugs/10/status")
      .send({ status_id: 3 });
    expect(response.status).toBe(403);
  });
  it("Should answer 403 if logged but is not admin", async () => {
    const response = await request(app)
      .patch("/bugs/10/status")
      .send({ status_id: 3 })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      message: "You are not authorized to do this",
    });
  });
  it("Should answer 200 if logged in as admin", async () => {
    const response = await request(app)
      .patch("/bugs/10/status")
      .send({ status_id: 3 })
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(200);
  });
  it("Should answer 400 if bug does not exist", async () => {
    const response = await request(app)
      .patch("/bugs/999/status")
      .send({ status_id: 3 })
      .set("Authorization", " Bearer admin");
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: "Bug not found",
    });
  });
  it("Should answer 403 if status does not exist", async () => {
    const response = await request(app)
      .patch("/bugs/10/status")
      .send({ status_id: 999 })
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      message: "Invalid Bug status",
    });
  });
});
