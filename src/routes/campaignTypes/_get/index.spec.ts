import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

describe("GET /campaignTypes", () => {
  beforeAll(async () => {
    const profile = {
      email: "",
      employment_id: 1,
      education_id: 1,
    };

    await tryber.tables.WpAppqEvdProfile.do().insert([
      {
        ...profile,
        id: 10,
        wp_user_id: 1,
        name: "PM",
        surname: "user",
      },
      {
        ...profile,
        id: 20,
        wp_user_id: 2,
        name: "TL",
        surname: "user",
      },
      {
        ...profile,
        id: 30,
        wp_user_id: 3,
        name: "TL 2",
        surname: "user",
      },
    ]);
    await tryber.tables.WpAppqCampaignType.do().insert([
      {
        id: 1,
        name: "Campaign Type 1",
        category_id: 1,
      },
      {
        id: 2,
        name: "Campaign Type 2",
        category_id: 2,
      },
      {
        id: 3,
        name: "Campaign Type 3",
        category_id: 3,
      },
    ]);

    await tryber.seeds().roles();

    const category = {
      tester_selection_xls: "",
      manual_template_id: 1,
      preview_template_id: 1,
      automatic_olps: "",
      automatic_user_olp_ids: "",
      tester_coach_ids: "",
      mailmerge_template_ids: "",
      use_case_template_ids: "",
    };
    await tryber.tables.WpAppqCampaignCategory.do().insert([
      {
        ...category,
        id: 1,
        name: "Test Category",

        custom_roles: JSON.stringify({
          "1": [1],
          "2": [2, 3],
        }),
      },
      {
        ...category,
        id: 2,
        name: "Other Category",
      },
      {
        ...category,
        id: 3,
        name: "Third Category",
        custom_roles: JSON.stringify({
          "1": [2],
          "2": [1, 3],
        }),
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqCampaignType.do().delete();
  });

  it("Should answer 403 if not logged in", () => {
    return request(app).get("/campaignTypes").expect(403);
  });
  it("Should answer 403 if logged in without permissions", async () => {
    const response = await request(app)
      .get("/campaignTypes")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });
  it("Should answer 200 if logged as user with full access on campaigns", async () => {
    const response = await request(app)
      .get("/campaignTypes")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
  });
  it("Should answer 200 if logged as user with access to some campaigns", async () => {
    const response = await request(app)
      .get("/campaignTypes")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1,2]}');
    expect(response.status).toBe(200);
  });

  it("Should answer with a list of types when user has full access", async () => {
    const response = await request(app)
      .get("/campaignTypes")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body).toHaveLength(3);
    expect(response.body[0]).toHaveProperty("id", 1);
    expect(response.body[0]).toHaveProperty("name", "Campaign Type 1");
    expect(response.body[1]).toHaveProperty("id", 2);
    expect(response.body[1]).toHaveProperty("name", "Campaign Type 2");
  });
  it("Should answer with a list of types when user has partial access to campaign", async () => {
    const response = await request(app)
      .get("/campaignTypes")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1,2]}');

    expect(response.body).toHaveLength(3);
    expect(response.body[0]).toHaveProperty("id", 1);
    expect(response.body[0]).toHaveProperty("name", "Campaign Type 1");
    expect(response.body[1]).toHaveProperty("id", 2);
    expect(response.body[1]).toHaveProperty("name", "Campaign Type 2");
  });

  it("Should return the list of custom roles", async () => {
    const response = await request(app)
      .get("/campaignTypes")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');

    expect(response.body).toHaveLength(3);
    expect(response.body[0]).toHaveProperty("customRoles", [
      {
        roleId: 1,
        userIds: [10],
      },
      {
        roleId: 2,
        userIds: [20, 30],
      },
    ]);
    expect(response.body[1]).toHaveProperty("customRoles", []);
    expect(response.body[2]).toHaveProperty("customRoles", [
      {
        roleId: 1,
        userIds: [20],
      },
      {
        roleId: 2,
        userIds: [10, 30],
      },
    ]);
  });
});
