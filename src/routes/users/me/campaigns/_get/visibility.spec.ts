import { expect } from "chai";
import RouteItem from "./index";

describe("getVisibility", () => {
  const routeItem = new RouteItem({} as any);

  it("should return 'candidate' if the user is already applied", () => {
    const result = routeItem["getVisibility"]({
      applied: true,
      start_date: "2024-08-01T14:05:35.545180",
    });
    expect(result).to.equal("candidate");
  });

  it("should return 'unavailable' if the start date is in the future", () => {
    const result = routeItem["getVisibility"]({
      applied: false,
      start_date: "2999-08-01T14:05:35.545180",
    });
    expect(result).to.equal("unavailable");
  });

  it("should return 'unavailable' if there are no free spots", () => {
    const result = routeItem["getVisibility"]({
      applied: false,
      start_date: "2024-08-01T14:05:35.545180",
      freeSpots: 0,
    });
    expect(result).to.equal("unavailable");
  });

  it("should return 'available' if the user is not applied, the start date is not in the future, and there are free spots", () => {
    const result = routeItem["getVisibility"]({
      applied: false,
      start_date: "2024-08-01T14:05:35.545180",
      freeSpots: 5,
    });
    expect(result).to.equal("available");
  });
});
import app from "@src/app";
import request from "supertest";
import { tryber } from "@src/features/database";

describe("GET /users/me/campaigns - visibility", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdProfile.do().insert([
      {
        id: 1,
        wp_user_id: 1,
        name: "jhon",
        surname: "doe",
        email: "jhon.doe@tryber.me",
        employment_id: 1,
        education_id: 1,
      },
    ]);
    await tryber.tables.WpUsers.do().insert([
      {
        ID: 1,
        user_login: "tester",
      },
    ]);
    const basicCampaignObject = {
      start_date: new Date().toISOString().split("T")[0],
      end_date: new Date().toISOString().split("T")[0],
      close_date: new Date().toISOString().split("T")[0],
      campaign_type_id: 1,
      page_preview_id: 1,
      page_manual_id: 2,
      os: "1",
      is_public: 0 as 0,
      status_id: 1 as 1,
      platform_id: 1,
      customer_id: 1,
      pm_id: 1,
      project_id: 1,
      customer_title: "Customer title",
      phase_id: 20,
    };
    await tryber.tables.WpAppqCampaignType.do().insert({
      id: 1,
      name: "Type",
      category_id: 1,
    });
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      {
        ...basicCampaignObject,
        id: 1,
        title: "Campaign applied",
        applied: 1,
      },
      {
        ...basicCampaignObject,
        id: 2,
        title: "Campaign future start date",
        start_date: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      },
      {
        ...basicCampaignObject,
        id: 3,
        title: "Campaign no free spots",
        freeSpots: 0,
      },
      {
        ...basicCampaignObject,
        id: 4,
        title: "Campaign available",
        freeSpots: 5,
      },
    ]);
  });

  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqCampaignType.do().delete();
    await tryber.tables.WpUsers.do().delete();
    await tryber.tables.WpAppqEvdProfile.do().delete();
  });

  it("should return 'candidate' if the user is already applied", async () => {
    const response = await request(app)
      .get("/users/me/campaigns")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    const campaign = response.body.results.find((c) => c.id === 1);
    expect(campaign.visibility).toBe("candidate");
  });

  it("should return 'unavailable' if the start date is in the future", async () => {
    const response = await request(app)
      .get("/users/me/campaigns")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    const campaign = response.body.results.find((c) => c.id === 2);
    expect(campaign.visibility).toBe("unavailable");
  });

  it("should return 'unavailable' if there are no free spots", async () => {
    const response = await request(app)
      .get("/users/me/campaigns")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    const campaign = response.body.results.find((c) => c.id === 3);
    expect(campaign.visibility).toBe("unavailable");
  });

  it("should return 'available' if the user is not applied, the start date is not in the future, and there are free spots", async () => {
    const response = await request(app)
      .get("/users/me/campaigns")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    const campaign = response.body.results.find((c) => c.id === 4);
    expect(campaign.visibility).toBe("available");
  });
});
