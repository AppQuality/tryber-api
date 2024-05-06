import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";
const campaign = {
  id: 1,
  platform_id: 1,
  start_date: new Date(new Date().getTime() - 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0],
  end_date: new Date(new Date().getTime() + 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0],
  title: "This is the title",
  page_preview_id: 1,
  page_manual_id: 1,
  customer_id: 1,
  pm_id: 1,
  project_id: 1,
  customer_title: "",
  campaign_pts: 200,
};
describe("GET /campaigns", () => {
  beforeAll(async () => {
    await tryber.tables.CampaignPhase.do().insert([
      { id: 1, name: "Draft", type_id: 1 },
    ]);
    await tryber.tables.WpAppqEvdProfile.do().insert([
      {
        id: 1,
        name: "name",
        surname: "surname",
        email: "",
        wp_user_id: 1,
        education_id: 1,
        employment_id: 1,
      },
    ]);
    await tryber.tables.WpAppqEvdProfile.do().insert([
      {
        id: 2,
        name: "name",
        surname: "surname",
        email: "",
        wp_user_id: 2,
        education_id: 1,
        employment_id: 1,
      },
    ]);
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      { ...campaign, id: 1, title: "First campaign" },
      { ...campaign, id: 2, title: "Second campaign" },
      { ...campaign, id: 3, title: "Third campaign" },
    ]);

    await tryber.tables.CustomRoles.do().insert([
      { id: 1, name: "PM", olp: "" },
      { id: 2, name: "Other", olp: "" },
    ]);

    await tryber.tables.CampaignCustomRoles.do().insert([
      { campaign_id: 1, custom_role_id: 1, tester_id: 1 },
      { campaign_id: 2, custom_role_id: 1, tester_id: 2 },
      { campaign_id: 3, custom_role_id: 1, tester_id: 1 },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.CampaignPhase.do().delete();
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqEvdProfile.do().delete();
    await tryber.tables.CustomRoles.do().delete();
    await tryber.tables.CampaignCustomRoles.do().delete();
  });

  it("Should return only campaigns with custom role with id 1 when filterBy[role_1]=1", async () => {
    const response = await request(app)
      .get("/campaigns?filterBy[role_1]=1")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(2);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 1, name: "First campaign" }),
        expect.objectContaining({ id: 3, name: "Third campaign" }),
      ])
    );
  });

  it("Should return filtered campaign total", async () => {
    const response = await request(app)
      .get("/campaigns?filterBy[role_1]=1&limit=10")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(2);
    expect(response.body.total).toBe(2);
  });

  it("Should return only campaigns with filtered csm", async () => {
    const response = await request(app)
      .get("/campaigns?filterBy[role_1]=2")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 2, name: "Second campaign" }),
      ])
    );
  });

  it("Should return all campaigns filtered by filterBy[role_1]", async () => {
    const response = await request(app)
      .get("/campaigns?filterBy[role_1]=1,2")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(3);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 1, name: "First campaign" }),
        expect.objectContaining({ id: 2, name: "Second campaign" }),
        expect.objectContaining({ id: 3, name: "Third campaign" }),
      ])
    );
  });
});
