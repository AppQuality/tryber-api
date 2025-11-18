import app from "@src/app";
import Unguess from "@src/features/class/Unguess";
import { tryber } from "@src/features/database";
import request from "supertest";

const mockPostCampaignWatchers = jest
  .fn()
  .mockResolvedValue({ result: "ok", status: 201 });
const mockTrigger = jest.fn().mockResolvedValue(undefined);

jest.mock("@src/features/class/Unguess", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    postCampaignWatchers: mockPostCampaignWatchers,
  })),
}));

jest.mock("@src/features/webhookTrigger", () => ({
  WebhookTrigger: jest.fn().mockImplementation(() => ({
    trigger: mockTrigger,
  })),
}));

const baseRequest = {
  project: 10,
  testType: 10,
  skipPagesAndTasks: 1,
  title: {
    customer: "Campaign Title for Customer",
    tester: "Campaign Title for Tester",
  },
  startDate: "2019-08-24T14:15:22Z",
  deviceList: [1],
};

describe("Route POST /dossiers", () => {
  beforeAll(async () => {
    await tryber.seeds().bug_types();
    await tryber.tables.CampaignPhase.do().insert([
      { id: 1, name: "Test Phase", type_id: 1 },
    ]);
    await tryber.tables.WpAppqEvdProfile.do().insert({
      id: 1,
      wp_user_id: 100,
      name: "",
      email: "",
      education_id: 1,
      employment_id: 1,
    });
    await tryber.tables.WpAppqCustomer.do().insert({
      id: 1,
      company: "Test Company",
      pm_id: 1,
    });
    await tryber.tables.WpAppqProject.do().insert({
      id: 10,
      display_name: "Test Project",
      customer_id: 1,
      edited_by: 1,
    });

    await tryber.tables.WpAppqUserToProject.do().insert({
      profile_id: 1,
      project_id: 10,
      wp_user_id: 100,
    });

    await tryber.tables.WpAppqUserToCustomer.do().insert({
      profile_id: 1,
      wp_user_id: 100,
      customer_id: 1,
    });

    await tryber.tables.WpAppqCampaignType.do().insert([
      {
        id: 10,
        name: "Test Type",
        description: "Test Description",
        category_id: 1,
        has_auto_apply: 1,
      },
      {
        id: 11,
        name: "Test Type No Auto Apply",
        description: "Test Description",
        category_id: 1,
      },
    ]);

    await tryber.tables.WpAppqEvdPlatform.do().insert([
      {
        id: 1,
        name: "Test Type",
        form_factor: 0,
        architecture: 1,
      },
      {
        id: 2,
        name: "Test Type",
        form_factor: 1,
        architecture: 1,
      },
    ]);

    await tryber.tables.CustomRoles.do().insert([
      { id: 1, name: "Test Role", olp: '["appq_bugs"]' },
    ]);

    await tryber.tables.ProductTypes.do().insert([
      {
        id: 1,
        name: "App",
      },
      {
        id: 2,
        name: "Web",
      },
    ]);
  });

  afterAll(async () => {
    await tryber.tables.WpAppqProject.do().delete();
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqUserToProject.do().delete();
    await tryber.tables.WpAppqUserToCustomer.do().delete();
    await tryber.tables.WpAppqCampaignType.do().delete();
    await tryber.tables.WpAppqEvdPlatform.do().delete();
    await tryber.tables.WpAppqProject.do().delete();
    await tryber.tables.ProductTypes.do().delete();
  });
  afterEach(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    mockPostCampaignWatchers.mockClear();
    mockTrigger.mockClear();
    (Unguess as jest.Mock).mockClear();
  });

  it("Should call postCampaignWatchers", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, notify_everyone: 1 });

    expect(mockPostCampaignWatchers).toHaveBeenCalledTimes(1);

    expect(mockPostCampaignWatchers).toHaveBeenCalledWith({
      profileIds: { users: [{ id: 1 }] },
      campaignId: expect.any(Number),
    });
  });

  it("Should not call postCampaignWatchers", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest });

    expect(mockPostCampaignWatchers).not.toHaveBeenCalled();
  });
});
