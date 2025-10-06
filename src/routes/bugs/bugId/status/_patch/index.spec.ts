import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

describe("PATCH /bugs/{BugId}/status", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      {
        id: 100,
        title: "Campaign 1",
        customer_title: "Customer Campaign 1",
        platform_id: 1,
        start_date: "2023-01-01",
        end_date: "2023-12-31",
        page_preview_id: 1,
        page_manual_id: 1,
        customer_id: 1,
        pm_id: 11111,
        project_id: 1,
      },
    ]);
    await tryber.tables.WpAppqEvdBug.do().insert([
      {
        id: 10,
        message: "Bug 1",
        description: "This is a bug",
        status_id: 2,
        campaign_id: 100,
        wp_user_id: 1,
        profile_id: 1,
        reviewer: 11111,
        last_editor_id: 11111,
        severity_id: 1,
        bug_type_id: 1,
        internal_id: "internal_id_1",
      },
    ]);
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
    await tryber.tables.WpAppqEvdSeverity.do().insert([
      {
        id: 1,
        name: "Critical",
      },
    ]);
    await tryber.tables.WpAppqEvdBugType.do().insert([
      {
        id: 1,
        name: "Functional",
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdBugStatus.do().delete();
    await tryber.tables.WpAppqEvdBug.do().delete();
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqEvdSeverity.do().delete();
    await tryber.tables.WpAppqEvdBugType.do().delete();
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
      .set("Authorization", "Bearer admin");
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
  it("Should update the status of the bug", async () => {
    const response = await request(app)
      .patch("/bugs/10/status")
      .send({ status_id: 3 })
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(200);

    const bugs = await request(app)
      .get("/campaigns/100/bugs")
      .set("Authorization", "Bearer admin");
    expect(bugs.status).toBe(200);
    expect(bugs.body.items).toHaveLength(1);
    expect(bugs.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 10,
          status: expect.objectContaining({
            id: 3,
            name: "Pending",
          }),
        }),
      ])
    );
  });
});
