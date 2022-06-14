import { data as campaignData } from "@src/__mocks__/mockedDb/campaign";
import app from "@src/app";
import request from "supertest";

describe("Route POST a bug to a specific campaign", () => {
  beforeEach(async () => {
    return new Promise(async (resolve) => {
      await campaignData.basicCampaign();

      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      await campaignData.drop();

      resolve(null);
    });
  });

  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).post("/users/me/campaigns/1/bugs");
    console.log(response.body);
    expect(response.status).toBe(403);
  });
});
