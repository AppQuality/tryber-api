import { tryber } from "@src/features/database";
import { StatusChangeHandler } from ".";

jest.mock("@src/features/webhookTrigger");
describe("StatusChangeHandler", () => {
  beforeAll(async () => {
    const campaign = {
      title: "Campaign 1",
      customer_title: "Customer 1",
      platform_id: 1,
      pm_id: 1,
      campaign_type_id: 1,
      start_date: "2019-08-24T14:15:22Z",
      end_date: "2019-08-24T14:15:22Z",
      page_manual_id: 1,
      page_preview_id: 1,
      project_id: 1,
    };
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      {
        ...campaign,
        id: 1,
        phase_id: 1,
        status_id: 1,
      },
      {
        ...campaign,
        id: 2,
        phase_id: 3,
        status_id: 2,
      },
    ]);
    await tryber.tables.CampaignPhase.do().insert([
      { id: 1, name: "Draft", type_id: 1, status_details: "Planned" },
      { id: 2, name: "Running", type_id: 2, status_details: "Running" },
      { id: 3, name: "Closed", type_id: 3, status_details: "Successful" },
    ]);

    await tryber.tables.CampaignPhaseType.do().insert([
      { id: 1, name: "unavailable" },
      { id: 2, name: "running" },
      { id: 3, name: "closed" },
    ]);
  });

  afterAll(async () => {
    await tryber.tables.CampaignPhase.do().delete();
    await tryber.tables.CampaignPhaseType.do().delete();
  });

  afterEach(async () => {
    await tryber.tables.CampaignPhaseHistory.do().delete();
  });
  it("should have a constructor", () => {
    const handler = new StatusChangeHandler({
      oldPhase: 1,
      newPhase: 2,
      campaignId: 1,
      creator: 1,
    });
    expect(handler).toBeDefined();
  });

  it("Should save the oldPhase, newPhase and campaignId", async () => {
    const handler = new StatusChangeHandler({
      oldPhase: 1,
      newPhase: 2,
      campaignId: 1,
      creator: 1,
    });

    await handler.run();

    const history = await tryber.tables.CampaignPhaseHistory.do()
      .select("phase_id", "created_by")
      .where("campaign_id", 1);

    expect(history).toHaveLength(1);

    expect(history[0].phase_id).toBe(2);
    expect(history[0].created_by).toBe(1);
  });

  it("Should change the status_id when changing to a closed phase", async () => {
    const handler = new StatusChangeHandler({
      oldPhase: 1,
      newPhase: 3,
      campaignId: 1,
      creator: 1,
    });

    await handler.run();

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select("status_id")
      .where("id", 1)
      .first();

    if (!campaign) throw new Error("Campaign not found");
    expect(campaign.status_id).toBe(2);
  });

  it("Should change the close date when changing to a closed phase", async () => {
    const handler = new StatusChangeHandler({
      oldPhase: 1,
      newPhase: 3,
      campaignId: 1,
      creator: 1,
    });

    await handler.run();

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select("close_date")
      .where("id", 1)
      .first();

    if (!campaign) throw new Error("Campaign not found");
    const now = new Date().toISOString().replace("T", " ").split(".")[0];
    expect(campaign.close_date).toBe(now);
  });

  it("Should change the status_id when changing from closed phase", async () => {
    const handler = new StatusChangeHandler({
      oldPhase: 3,
      newPhase: 1,
      campaignId: 2,
      creator: 1,
    });

    await handler.run();

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select("status_id")
      .where("id", 2)
      .first();

    if (!campaign) throw new Error("Campaign not found");
    expect(campaign.status_id).toBe(1);
  });

  it("Should change the status details of the campaign", async () => {
    const handler = new StatusChangeHandler({
      oldPhase: 3,
      newPhase: 1,
      campaignId: 2,
      creator: 1,
    });

    await handler.run();

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select("status_details")
      .where("id", 2)
      .first();

    if (!campaign) throw new Error("Campaign not found");
    expect(campaign.status_details).toBe("Planned");
  });
});
