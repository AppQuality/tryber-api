import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";
import useCampaign from "./useCampaign";

useCampaign();

beforeAll(async () => {
  await tryber.tables.WpAppqEvdProfile.do().insert([
    {
      id: 2,
      name: "John",
      surname: "Doe",
      wp_user_id: 2,
      email: "",
      employment_id: 1,
      education_id: 1,
    },
    {
      id: 3,
      name: "John",
      surname: "Doe",
      wp_user_id: 3,
      email: "",
      employment_id: 1,
      education_id: 1,
    },
  ]);
  await tryber.tables.WpUsers.do().insert([{ ID: 2 }, { ID: 3 }]);
  await tryber.tables.WpCrowdAppqHasCandidate.do().insert([
    {
      campaign_id: 1,
      user_id: 2,
      accepted: 1,
      devices: "0",
      selected_device: 1,
      results: 0,
      group_id: 2,
    },
    {
      campaign_id: 1,
      user_id: 3,
      accepted: 1,
      devices: "0",
      selected_device: 1,
      results: 0,
      group_id: 3,
    },
  ]);
});

describe("GET /campaigns/campaignId/prospect", () => {
  it("Should filter by group include", async () => {
    const response = await request(app)
      .get("/campaigns/1/prospect?filterByInclude[groups]=1,2")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("items");
    expect(response.body.items).toHaveLength(2);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tester: { id: 1, name: "John", surname: "Doe", group: 1 },
        }),
        expect.objectContaining({
          tester: { id: 2, name: "John", surname: "Doe", group: 2 },
        }),
      ])
    );
  });

  it("Should allow combining filter by group include and filter by id include", async () => {
    const response = await request(app)
      .get(
        "/campaigns/1/prospect?filterByInclude[groups]=1,2&filterByInclude[ids]=1"
      )
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("items");
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tester: { id: 1, name: "John", surname: "Doe", group: 1 },
        }),
      ])
    );
  });

  it("Should allow combining filter by group include and filter by id include with empty set", async () => {
    const response = await request(app)
      .get(
        "/campaigns/1/prospect?filterByInclude[groups]=1,2&filterByInclude[ids]=3"
      )
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("items");
    expect(response.body.items).toHaveLength(0);
    expect(response.body.items).toEqual([]);
  });
  it("Should filter by group exclude", async () => {
    const response = await request(app)
      .get("/campaigns/1/prospect?filterByExclude[groups]=1,2")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("items");
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tester: { id: 3, name: "John", surname: "Doe", group: 3 },
        }),
      ])
    );
  });
});
