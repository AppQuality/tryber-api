import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

describe("Route PUT /dossiers/:id/agreements", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqProject.do().insert([
      { id: 1, customer_id: 1, display_name: "Project 1", edited_by: 1 },
    ]);
    await tryber.tables.WpAppqCustomer.do().insert([
      { id: 1, company: "Customer 1", pm_id: 1 },
    ]);
    await tryber.tables.WpAppqEvdProfile.do().insert([
      {
        id: 1,
        wp_user_id: 1,
        name: "CSM",
        surname: "",
        email: "",
        education_id: 1,
        employment_id: 1,
      },
    ]);
  });

  afterAll(async () => {
    await tryber.tables.WpAppqProject.do().delete();
    await tryber.tables.WpAppqCustomer.do().delete();
    await tryber.tables.WpAppqEvdProfile.do().delete();
  });

  beforeEach(async () => {
    const campaign = {
      title: "Campaign 1",
      customer_title: "Customer 1",
      platform_id: 1,
      pm_id: 1,
      campaign_type_id: 1,
      page_manual_id: 1,
      page_preview_id: 1,
      start_date: "2021-01-01T00:00:00.000Z",
      end_date: "2021-12-31T00:00:00.000Z",
      close_date: "2022-01-01T00:00:00.000Z",
      tokens_usage: 1.4,
      customer_id: 1,
      project_id: 1,
      phase_id: 1,
      os: "",
    };

    await tryber.tables.WpAppqEvdCampaign.do().insert([
      {
        ...campaign,
        id: 1,
      },
    ]);

    await tryber.tables.FinanceAgreements.do().insert([
      {
        id: 1,
        customer_id: 1,
        tokens: 10,
        token_unit_price: 1.3,
        additional_note: "note",
        title: "Agreement 1",
        agreement_close_date: "2022-12-31",
        agreement_date: "2021-01-01",
      },
      {
        id: 2,
        customer_id: 1,
        tokens: 30,
        token_unit_price: 1.3,
        additional_note: "note 2",
        title: "Agreement 2",
        agreement_close_date: "2022-12-31",
        agreement_date: "2021-01-01",
      },
    ]);
  });

  afterEach(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.FinanceAgreements.do().delete();
    await tryber.tables.FinanceCampaignToAgreement.do().delete();
  });

  it("Should return 403 if not logged in", async () => {
    const response = await request(app)
      .put("/dossiers/1/agreements")
      .send({ agreementId: 1, tokens: 5 });
    expect(response.status).toBe(403);
  });

  it("Should return 200 if logged in as admin", async () => {
    const response = await request(app)
      .put("/dossiers/1/agreements")
      .send({ agreementId: 1, tokens: 5 })
      .set("Authorization", "Bearer admin");

    expect(response.status).toBe(200);
  });

  it("Should return 403 if logged in as tester", async () => {
    const response = await request(app)
      .put("/dossiers/1/agreements")
      .send({ agreementId: 1, tokens: 5 })
      .set("Authorization", "Bearer tester");

    expect(response.status).toBe(403);
  });

  it("Should return 200 if has access to the campaign", async () => {
    const response = await request(app)
      .put("/dossiers/1/agreements")
      .send({ agreementId: 1, tokens: 5 })
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');

    expect(response.status).toBe(200);
  });

  it("Should return 200 if has all campaign olps", async () => {
    const response = await request(app)
      .put("/dossiers/1/agreements")
      .send({ agreementId: 1, tokens: 5 })
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');

    expect(response.status).toBe(200);
  });

  it("Should return 400 if campaign does not exists", async () => {
    const response = await request(app)
      .put("/dossiers/100/agreements")
      .send({ agreementId: 1, tokens: 5 })
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[100]}');

    expect(response.status).toBe(400);
  });

  describe("Request body checks", () => {
    describe("Invalid body", () => {
      it("Should return 400 if body is missing", async () => {
        const response = await request(app)
          .put("/dossiers/1/agreements")
          .set("Authorization", "Bearer admin");

        expect(response.status).toBe(400);
      });

      it("Should return 400 if agreementId is missing", async () => {
        const response = await request(app)
          .put("/dossiers/1/agreements")
          .send({ tokens: 5 })
          .set("Authorization", "Bearer admin");

        expect(response.status).toBe(400);
      });

      it("Should return 400 if tokens is missing", async () => {
        const response = await request(app)
          .put("/dossiers/1/agreements")
          .send({ agreementId: 1 })
          .set("Authorization", "Bearer admin");

        expect(response.status).toBe(400);
      });

      it("Should return 400 if agreementId is not a positive integer", async () => {
        const response = await request(app)
          .put("/dossiers/1/agreements")
          .send({ agreementId: -5, tokens: 5 })
          .set("Authorization", "Bearer admin");

        expect(response.status).toBe(400);
      });

      it("Should return 400 if tokens is not a positive number", async () => {
        const response = await request(app)
          .put("/dossiers/1/agreements")
          .send({ agreementId: 1, tokens: -5 })
          .set("Authorization", "Bearer admin");

        expect(response.status).toBe(400);
      });

      it("Should return 400 if both tokens and agreementId are not valid", async () => {
        const response = await request(app)
          .put("/dossiers/1/agreements")
          .send({ agreementId: "hello", tokens: -5 })
          .set("Authorization", "Bearer admin");

        expect(response.status).toBe(400);
      });
    });

    describe("Valid body", () => {
      it("Should update the tokens usage and return 200", async () => {
        const response = await request(app)
          .put("/dossiers/1/agreements")
          .send({ agreementId: 1, tokens: 7.5 })
          .set("Authorization", "Bearer admin");

        expect(response.status).toBe(200);

        const campaign = await tryber.tables.WpAppqEvdCampaign.do()
          .select("tokens_usage")
          .where("id", 1)
          .first();

        expect(campaign?.tokens_usage).toBe(7.5);
      });

      it("Should update the tokens usage and return 200 also with tokens=0", async () => {
        const response = await request(app)
          .put("/dossiers/1/agreements")
          .send({ agreementId: 1, tokens: 0 })
          .set("Authorization", "Bearer admin");

        expect(response.status).toBe(200);

        const campaign = await tryber.tables.WpAppqEvdCampaign.do()
          .select("tokens_usage")
          .where("id", 1)
          .first();

        expect(campaign?.tokens_usage).toBe(0);
      });

      describe("Link between campaign and agreement does not exists", () => {
        it("Should create the link between campaign and agreement", async () => {
          const response = await request(app)
            .put("/dossiers/1/agreements")
            .send({ agreementId: 1, tokens: 8 })
            .set("Authorization", "Bearer admin");

          expect(response.status).toBe(200);

          const link = await tryber.tables.FinanceCampaignToAgreement.do()
            .select("agreement_id")
            .where("cp_id", 1)
            .first();

          expect(link?.agreement_id).toBe(1);
        });
      });
    });

    describe("Link between campaign and agreement already exists", () => {
      beforeEach(async () => {
        await tryber.tables.FinanceCampaignToAgreement.do().insert([
          {
            cp_id: 1,
            agreement_id: 2,
            last_editor_id: 1,
          },
        ]);
      });

      afterEach(async () => {
        await tryber.tables.FinanceCampaignToAgreement.do().delete();
      });

      it("Should update the link between campaign and agreement", async () => {
        const response = await request(app)
          .put("/dossiers/1/agreements")
          .send({ agreementId: 1, tokens: 9 })
          .set("Authorization", "Bearer admin");

        expect(response.status).toBe(200);

        const link = await tryber.tables.FinanceCampaignToAgreement.do()
          .select("agreement_id")
          .where("cp_id", 1)
          .first();

        expect(link?.agreement_id).toBe(1);
      });
    });
  });
});
