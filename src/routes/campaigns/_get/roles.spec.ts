import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

describe("GET /campaigns - roles", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert({
      id: 1,
      platform_id: 1,
      start_date: "2023-01-13 10:10:10",
      end_date: "2023-01-14 10:10:10",
      title: "This is the title",
      page_preview_id: 1,
      page_manual_id: 1,
      customer_id: 1,
      pm_id: 1,
      project_id: 1,
      customer_title: "",
      campaign_pts: 200,
    });

    await tryber.tables.WpAppqEvdProfile.do().insert({
      id: 1,
      name: "User",
      surname: "Name",
      email: "",
      wp_user_id: 1,
      education_id: 1,
      employment_id: 1,
    });

    await tryber.tables.CustomRoles.do().insert({
      id: 1,
      name: "Role",
      olp: "",
    });

    await tryber.tables.CampaignCustomRoles.do().insert({
      id: 1,
      campaign_id: 1,
      custom_role_id: 1,
      tester_id: 1,
    });
  });

  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqEvdProfile.do().delete();
    await tryber.tables.CustomRoles.do().delete();
    await tryber.tables.CampaignCustomRoles.do().delete();
  });

  it("Should return roles", async () => {
    const response = await request(app)
      .get("/campaigns")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);

    expect(response.body).toHaveProperty("items");
    const { items } = response.body;
    expect(items).toHaveLength(1);

    expect(items[0]).toHaveProperty("roles");

    const { roles } = items[0];

    expect(roles).toEqual([
      {
        role: { id: 1, name: "Role" },
        user: { id: 1, name: "User", surname: "Name" },
      },
    ]);
  });

  it("Should not return roles if not in fields", async () => {
    const response = await request(app)
      .get("/campaigns?fields=id")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);

    expect(response.body).toHaveProperty("items");
    const { items } = response.body;
    expect(items).toHaveLength(1);

    expect(items[0]).not.toHaveProperty("roles");
  });

  it("Should return roles if in fields", async () => {
    const response = await request(app)
      .get("/campaigns?fields=roles")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);

    expect(response.body).toHaveProperty("items");
    const { items } = response.body;
    expect(items).toHaveLength(1);

    expect(items[0]).toHaveProperty("roles");

    const { roles } = items[0];

    expect(roles).toEqual([
      {
        role: { id: 1, name: "Role" },
        user: { id: 1, name: "User", surname: "Name" },
      },
    ]);
  });
});
