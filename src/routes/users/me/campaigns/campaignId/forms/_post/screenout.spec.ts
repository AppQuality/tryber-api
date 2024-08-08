import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

describe("POST users/me/campaigns/:campaignId/forms - screenout", () => {
  beforeEach(async () => {
    await tryber.tables.WpAppqEvdProfile.do().insert({
      id: 1,
      wp_user_id: 1,
      email: "",
      employment_id: 1,
      education_id: 1,
    });
    await tryber.tables.WpAppqEvdCampaign.do().insert({
      id: 1,
      start_date: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      end_date: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      title: "Cp",
      customer_title: "Cp",
      is_public: 1,
      os: "1,2",
      platform_id: 1,
      page_preview_id: 1,
      page_manual_id: 1,
      pm_id: 1,
      project_id: 1,
      customer_id: 1,
    });
    await tryber.tables.WpAppqCustomUserField.do().insert({
      id: 1,
      slug: "select-field",
      name: "Select field",
      type: "select",
      placeholder: "",
      extras: "",
      custom_user_field_group_id: 0,
    });
    await tryber.tables.WpAppqCustomUserField.do().insert({
      id: 2,
      slug: "multiselect-field",
      name: "Multiselect field",
      type: "multiselect",
      placeholder: "",
      extras: "",
      custom_user_field_group_id: 0,
    });
    await tryber.tables.WpAppqCustomUserFieldExtras.do().insert([
      {
        id: 1,
        custom_user_field_id: 1,
        name: "Yes",
      },
      {
        id: 2,
        custom_user_field_id: 2,
        name: "Red",
      },
      {
        id: 11,
        custom_user_field_id: 1,
        name: "No",
      },
      {
        id: 22,
        custom_user_field_id: 2,
        name: "Blue",
      },
      {
        id: 222,
        custom_user_field_id: 2,
        name: "Yellow",
      },
    ]);
    await tryber.tables.WpAppqCampaignPreselectionForm.do().insert({
      id: 1,
      campaign_id: 1,
    });
    await tryber.tables.WpAppqCampaignPreselectionFormFields.do().insert({
      id: 1,
      form_id: 1,
      type: "select",
      options: JSON.stringify(["Yes", "No"]),
      invalid_options: JSON.stringify(["No"]),
    });
    await tryber.tables.WpAppqCampaignPreselectionFormFields.do().insert({
      id: 2,
      form_id: 1,
      type: "multiselect",
      options: JSON.stringify(["Blue", "Red", "Yellow"]),
      invalid_options: JSON.stringify(["Blue", "Red"]),
    });
    await tryber.tables.WpAppqCampaignPreselectionFormFields.do().insert({
      id: 3,
      form_id: 1,
      type: "radio",
      options: JSON.stringify(["Yes", "No"]),
      invalid_options: JSON.stringify(["No"]),
    });
    await tryber.tables.WpAppqCampaignPreselectionFormFields.do().insert({
      id: 4,
      form_id: 1,
      type: "cuf_1",
      options: JSON.stringify([1, 11]),
      invalid_options: JSON.stringify([1]),
    });
    await tryber.tables.WpAppqCampaignPreselectionFormFields.do().insert({
      id: 5,
      form_id: 1,
      type: "cuf_2",
      options: JSON.stringify([2, 22, 222]),
      invalid_options: JSON.stringify([2, 22]),
    });
    await tryber.tables.WpCrowdAppqDevice.do().insert({
      id: 1,
      id_profile: 1,
      enabled: 1,
      platform_id: 1,
    });
  });

  afterEach(async () => {
    await tryber.tables.WpAppqEvdProfile.do().delete();
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpCrowdAppqDevice.do().delete();
    await tryber.tables.WpAppqCampaignPreselectionForm.do().delete();
    await tryber.tables.WpAppqCampaignPreselectionFormFields.do().delete();
    await tryber.tables.WpAppqCampaignPreselectionFormData.do().delete();
    await tryber.tables.WpAppqExpPoints.do().delete();
    await tryber.tables.WpCrowdAppqHasCandidate.do().delete();
    await tryber.tables.WpAppqCustomUserField.do().delete();
    await tryber.tables.WpAppqCustomUserFieldExtras.do().delete();
  });
  it("Should set candidate with applied -1 if invalid answer is selected for select", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({
        device: [1],
        form: [
          {
            question: 1,
            value: { serialized: "No" },
          },
        ],
      })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    const candidate = await tryber.tables.WpCrowdAppqHasCandidate.do()
      .select("accepted")
      .where("campaign_id", 1)
      .where("user_id", 1)
      .first();
    expect(candidate).toEqual({ accepted: -1 });
  });
  it("Should set candidate with applied 0 if valid answer is selected for select", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({
        device: [1],
        form: [
          {
            question: 1,
            value: { serialized: "Yes" },
          },
        ],
      })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    const candidate = await tryber.tables.WpCrowdAppqHasCandidate.do()
      .select("accepted")
      .where("campaign_id", 1)
      .where("user_id", 1)
      .first();
    expect(candidate).toEqual({ accepted: 0 });
  });
  it("Should set candidate with applied -1 if invalid answer is selected for radio", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({
        device: [1],
        form: [
          {
            question: 3,
            value: { serialized: "No" },
          },
        ],
      })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    const candidate = await tryber.tables.WpCrowdAppqHasCandidate.do()
      .select("accepted")
      .where("campaign_id", 1)
      .where("user_id", 1)
      .first();
    expect(candidate).toEqual({ accepted: -1 });
  });
  it("Should set candidate with applied 0 if valid answer is selected for radio", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({
        device: [1],
        form: [
          {
            question: 3,
            value: { serialized: "Yes" },
          },
        ],
      })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    const candidate = await tryber.tables.WpCrowdAppqHasCandidate.do()
      .select("accepted")
      .where("campaign_id", 1)
      .where("user_id", 1)
      .first();
    expect(candidate).toEqual({ accepted: 0 });
  });
  it("Should set candidate with applied -1 if all invalid answers are selected for multiselect", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({
        device: [1],
        form: [
          {
            question: 2,
            value: { serialized: ["Blue", "Red"] },
          },
        ],
      })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    const candidate = await tryber.tables.WpCrowdAppqHasCandidate.do()
      .select("accepted")
      .where("campaign_id", 1)
      .where("user_id", 1)
      .first();
    expect(candidate).toEqual({ accepted: -1 });
  });
  it("Should set candidate with applied -1 if some invalid answers are selected for multiselect", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({
        device: [1],
        form: [
          {
            question: 2,
            value: { serialized: ["Blue", "Yellow"] },
          },
        ],
      })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    const candidate = await tryber.tables.WpCrowdAppqHasCandidate.do()
      .select("accepted")
      .where("campaign_id", 1)
      .where("user_id", 1)
      .first();
    expect(candidate).toEqual({ accepted: -1 });
  });
  it("Should set candidate with applied 0 if all valid answers are selected for multiselect", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({
        device: [1],
        form: [
          {
            question: 2,
            value: { serialized: ["Yellow"] },
          },
        ],
      })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    const candidate = await tryber.tables.WpCrowdAppqHasCandidate.do()
      .select("accepted")
      .where("campaign_id", 1)
      .where("user_id", 1)
      .first();
    expect(candidate).toEqual({ accepted: 0 });
  });
  it("Should set candidate with applied -1 if invalid answer is selected for cuf select", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({
        device: [1],
        form: [
          {
            question: 4,
            value: { id: 1, serialized: "1" },
          },
        ],
      })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    const candidate = await tryber.tables.WpCrowdAppqHasCandidate.do()
      .select("accepted")
      .where("campaign_id", 1)
      .where("user_id", 1)
      .first();
    expect(candidate).toEqual({ accepted: -1 });
  });
  it("Should set candidate with applied 0 if valid answer is selected for cuf select", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({
        device: [1],
        form: [
          {
            question: 4,
            value: { id: 11, serialized: "11" },
          },
        ],
      })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    const candidate = await tryber.tables.WpCrowdAppqHasCandidate.do()
      .select("accepted")
      .where("campaign_id", 1)
      .where("user_id", 1)
      .first();
    expect(candidate).toEqual({ accepted: 0 });
  });
  it("Should set candidate with applied -1 if all invalid answers are selected for multiselect cuf", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({
        device: [1],
        form: [
          {
            question: 5,
            value: { id: [2, 22], serialized: ["Red", "Blue"] },
          },
        ],
      })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    const candidate = await tryber.tables.WpCrowdAppqHasCandidate.do()
      .select("accepted")
      .where("campaign_id", 1)
      .where("user_id", 1)
      .first();
    expect(candidate).toEqual({ accepted: -1 });
  });
  it("Should set candidate with applied -1 if some invalid answers are selected for multiselect cuf", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({
        device: [1],
        form: [
          {
            question: 5,
            value: { id: [2, 222], serialized: ["Red", "Yellow"] },
          },
        ],
      })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    const candidate = await tryber.tables.WpCrowdAppqHasCandidate.do()
      .select("accepted")
      .where("campaign_id", 1)
      .where("user_id", 1)
      .first();
    expect(candidate).toEqual({ accepted: -1 });
  });
  it("Should set candidate with applied 0 if all valid answers are selected for multiselect cuf", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({
        device: [1],
        form: [
          {
            question: 5,
            value: { id: [222], serialized: ["Yellow"] },
          },
        ],
      })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    const candidate = await tryber.tables.WpCrowdAppqHasCandidate.do()
      .select("accepted")
      .where("campaign_id", 1)
      .where("user_id", 1)
      .first();
    expect(candidate).toEqual({ accepted: 0 });
  });
});
