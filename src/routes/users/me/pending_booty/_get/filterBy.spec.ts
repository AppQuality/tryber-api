import Attributions, {
  AttributionParams,
} from "@src/__mocks__/mockedDb/attributions";
import Campaigns from "@src/__mocks__/mockedDb/campaign";
import app from "@src/app";
import request from "supertest";
import { tryber } from "@src/features/database";

const campaign1 = {
  id: 1,
  title: "The Best Campaign ever",
  platform_id: 1,
  start_date: "1970-01-01",
  end_date: "2070-01-01",
  page_preview_id: 1,
  page_manual_id: 1,
  customer_id: 1,
  pm_id: 85,
  project_id: 1,
  customer_title: "Customer Title",
};
const campaign2 = {
  ...campaign1,
  id: 2,
  title: "Absolut Best Campaign ever",
};
const campaign10 = {
  ...campaign1,
  id: 10,
  title: "Absolut Best Campaign ever",
};

const attributionExpired: AttributionParams = {
  id: 3,
  tester_id: 1,
  campaign_id: 10,
  amount: 99,
  creation_date: "1960-01-01 00:00:00",
  is_paid: 0,
  is_requested: 0,
  work_type_id: 3,
  is_expired: 1,
};

const attributionNotExpired: AttributionParams = {
  id: 4,
  tester_id: 1,
  campaign_id: 3,
  amount: 100,
  creation_date: "1980-01-01 00:00:00",
  is_paid: 0,
  is_requested: 0,
  work_type_id: 3,
  is_expired: 0,
};

describe("GET /users/me/pending_booty  - filterBy isExpired", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert(campaign1);
    await tryber.tables.WpAppqEvdCampaign.do().insert(campaign2);
    await tryber.tables.WpAppqEvdCampaign.do().insert(campaign10);
    await tryber.tables.WpAppqPayment.do().insert(attributionExpired);
    await tryber.tables.WpAppqPayment.do().insert(attributionNotExpired);
    await tryber.tables.WpAppqPaymentWorkTypes.do().insert([
      { id: 1, work_type: "B Activity1" },
      { id: 2, work_type: "A Activity2" },
      { id: 3, work_type: "C Activity3" },
    ]);
    await tryber.tables.WpAppqFiscalProfile.do().insert([
      {
        fiscal_category: 1,
        tester_id: 1,
        name: "test1",
        surname: "surname1",
        sex: "1",
        birth_date: "1990-01-01",
      },
    ]);
  });
  afterAll(async () => {
    await Attributions.clear();
    await Campaigns.clear();
    await tryber.tables.WpAppqFiscalProfile.do().delete();
    await tryber.tables.WpAppqPaymentWorkTypes.do().delete();
  });

  it("Should filter by isExpired = 1", async () => {
    const response = await request(app)
      .get("/users/me/pending_booty?filterBy[isExpired]=1")
      .set("Authorization", "Bearer tester1");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      total: 1,
      items: [
        {
          id: 3,
          attributionDate: "1960-01-01",
          amount: 99,
          cp_title: "Absolut Best Campaign ever",
          cp_id: 10,
          activity: "C Activity3",
        },
      ],
    });
  });

  it("Should filter by isExpired = 0", async () => {
    const response = await request(app)
      .get("/users/me/pending_booty?filterBy[isExpired]=0")
      .set("Authorization", "Bearer tester1")
      .query({ filterBy: { isExpired: 0 } });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      total: 1,
      items: [
        {
          id: 4,
          attributionDate: "1980-01-01",
          amount: 100,
          cp_title: "The Best Campaign ever",
          cp_id: 1,
          activity: "B Activity1",
        },
      ],
    });
  });
});
