import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

const basicAgreement = {
  id: 1,
  customer_id: 1,
  title: "Agreement",
  tokens: 10,
  token_unit_price: 1,
  agreement_date: "2020-01-01",
  agreement_close_date: "2020-01-01",
  additional_note: "",
  last_editor_id: 999,
};
describe("DELETE /agreements/{agreementId}", () => {
  beforeEach(async () => {
    await tryber.tables.FinanceAgreements.do().insert([
      {
        ...basicAgreement,
        id: 1,
      },
      {
        ...basicAgreement,
        id: 2,
      },
    ]);
  });
  afterEach(async () => {
    await tryber.tables.FinanceAgreements.do().delete();
  });

  it("Should return 403 if not logged in", async () => {
    const response = await request(app).delete("/agreements/1");
    expect(response.status).toBe(403);
  });

  it("Should return 403 if logged in as tester", async () => {
    const response = await request(app)
      .delete("/agreements/1")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });
  it("Should return 403 if logged in as user with single campaign olp", async () => {
    const response = await request(app)
      .delete("/agreements/1")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1,2]}');
    expect(response.status).toBe(403);
  });
  it("Should return 200 if logged in as user with full access to campaign", async () => {
    const response = await request(app)
      .delete("/agreements/1")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
  });

  it("Should return 403 if agreement does not exists", async () => {
    const response = await request(app)
      .delete("/agreements/9999")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(403);
  });

  it("Should delete the agreement on success", async () => {
    await request(app)
      .delete("/agreements/1")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    const deletedAgreements = await tryber.tables.FinanceAgreements.do()
      .select()
      .where({ id: 1 });
    expect(deletedAgreements).toHaveLength(0);
    const allAgreements = await tryber.tables.FinanceAgreements.do().select();
    expect(allAgreements).not.toHaveLength(0);
  });
});
