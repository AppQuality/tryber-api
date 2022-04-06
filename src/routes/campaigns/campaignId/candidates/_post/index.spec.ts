import {
  data as cpData,
  table as cpTable,
} from "@src/__mocks__/mockedDb/campaign";
import {
  data as testerData,
  table as testerTable,
} from "@src/__mocks__/mockedDb/profile";
import {
  data as wpUsersData,
  table as wpUsersTable,
} from "@src/__mocks__/mockedDb/wp_users";
import app from "@src/app";
import request from "supertest";

jest.mock("@src/features/db");
jest.mock("@appquality/wp-auth");
describe("POST /campaigns/{campaignId}/candidates", () => {
  beforeEach(async () => {
    return new Promise(async (resolve) => {
      await cpTable.create();
      await cpData.runningCp();
      await testerTable.create();
      await testerData.testerWithBooty();
      await wpUsersTable.create();
      await wpUsersData.basicUser();
      // await candidatesTable.create();
      // await candidatesData.candidate1();
      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      await cpTable.drop();
      await testerTable.drop();
      await wpUsersTable.drop();
      // await candidatesTable.drop();
      resolve(null);
    });
  });
  it("Should return 403 if user is not admin", async () => {
    const response = await request(app)
      .post("/campaigns/1/candidates")
      .send({ tester_id: 1 })
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });
  it("Should return 200 if user is admin and campaignId exist", async () => {
    const response = await request(app)
      .post("/campaigns/1/candidates")
      .send({ tester_id: 1 })
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
  });
  it("Should return 404 if tester_id does not exist", async () => {
    const response = await request(app)
      .post("/campaigns/1/candidates")
      .send({ tester_id: 69 })
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(404);
  });
  /*
  it("Should return 403 if tester is already candidate on campaign", async () => {
    const response = await request(app)
    .post("/campaigns/1/candidates")
    .send({ tester_id: 1 })
    .set("authorization", "Bearer admin");
    const responseJustCandidate = await request(app)
    .post("/campaigns/1/candidates")
    .send({ tester_id: 1 })
    .set("authorization", "Bearer admin");
    expect(responseJustCandidate.status).toBe(403);
  });
*/
  /*
    it("Should set the attribution of the payments as unrequested", async () => {
      const attributions = await sqlite3.all(`SELECT * FROM wp_appq_payment`);
      expect(attributions[0].is_requested).toBe(1);
      expect(attributions[1].is_requested).toBe(1);
  
      const response = await request(app)
        .delete("/payments/1")
        .set("authorization", "Bearer admin");
  
      const attributionsAfterDeletion = await sqlite3.all(
        `SELECT * FROM wp_appq_payment`
      );
      expect(attributionsAfterDeletion[0].is_requested).toBe(0);
      expect(attributionsAfterDeletion[1].is_requested).toBe(0);
    });
    it("Should return 404 if user is admin and paymentId does not exist", async () => {
      const response = await request(app)
        .delete("/payments/69")
        .set("authorization", "Bearer admin");
      expect(response.status).toBe(404);
    });
    */
});
