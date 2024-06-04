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
      { id: 2, name: "Running", type_id: 2 },
      { id: 3, name: "Confirmed", type_id: 2 },
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
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      { ...campaign, id: 1, title: "First test campaign", phase_id: 1 },
      { ...campaign, id: 2, title: "Second test campaign", phase_id: 2 },
      { ...campaign, id: 3, title: "Third test campaign", phase_id: 3 },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.CampaignPhase.do().delete();
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqEvdProfile.do().delete();
  });

  it("Should return the phase of the campaigns", async () => {
    const response = await request(app)
      .get("/campaigns?fields=id,phase")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');

    expect(response.status).toBe(200);

    expect(response.body.items).toHaveLength(3);

    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          phase: {
            id: 1,
            name: "Draft",
          },
        }),
        expect.objectContaining({
          id: 2,
          phase: {
            id: 2,
            name: "Running",
          },
        }),
        expect.objectContaining({
          id: 3,
          phase: {
            id: 3,
            name: "Confirmed",
          },
        }),
      ])
    );
  });

  it("Should allow filtering by phase", async () => {
    const response = await request(app)
      .get("/campaigns?filterBy[phase]=1")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');

    expect(response.status).toBe(200);

    expect(response.body.items).toHaveLength(1);

    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          phase: {
            id: 1,
            name: "Draft",
          },
        }),
      ])
    );
  });
  it("Should allow filtering by multiple phases", async () => {
    const response = await request(app)
      .get("/campaigns?filterBy[phase]=1,2")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');

    expect(response.status).toBe(200);

    expect(response.body.items).toHaveLength(2);

    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          phase: {
            id: 1,
            name: "Draft",
          },
        }),
        expect.objectContaining({
          id: 2,
          phase: {
            id: 2,
            name: "Running",
          },
        }),
      ])
    );
  });
});
