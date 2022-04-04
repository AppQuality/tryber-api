import app from "@src/app";
import request from "supertest";
import { table, data } from "@src/__mocks__/mockedDb/paymentRequest";

jest.mock("@src/features/db");
jest.mock("@appquality/wp-auth");
describe("DELETE/payments/{paymentId}", () => {
  beforeAll(async () => {
    return new Promise(async (resolve) => {
      await table.create();
      await data.processingPaypalPayment();
      resolve(null);
    });
  });
  afterAll(async () => {
    return new Promise(async (resolve) => {
      await table.drop();
      resolve(null);
    });
  });
  it("should return 403 if user is not admin", async () => {
    const response = await request(app)
      .delete("/payments/1")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });
  it("should return 200 if user is admin and paymentId exist", async () => {
    const response = await request(app)
      .delete("/payments/1")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
  });
  it("should return 404 if user is admin and paymentId does not exist", async () => {
    const response = await request(app)
      .delete("/payments/2")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(404);
  });
});
