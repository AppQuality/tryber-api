import {
  data as paymentRequestData,
  table as paymentRequestTable,
} from "@src/__mocks__/mockedDb/paymentRequest";
import app from "@src/app";
import sqlite3 from "@src/features/sqlite";
import request from "supertest";

jest.mock("@src/features/db");
jest.mock("@appquality/wp-auth");
describe("DELETE /payments/{paymentId}", () => {
  beforeEach(async () => {
    return new Promise(async (resolve) => {
      await paymentRequestTable.create();
      await paymentRequestData.processingPaypalPayment({ id: 1 });
      await paymentRequestData.paidPaypalPayment({ id: 2 });
      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      await paymentRequestTable.drop();
      resolve(null);
    });
  });
  it("Should return 403 if user is not admin", async () => {
    const response = await request(app)
      .delete("/payments/1")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });
  it("Should return 200 if user is admin and paymentId exist", async () => {
    const response = await request(app)
      .delete("/payments/1")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
  });
  it("Should remove from database the payment_request if paymentId exists", async () => {
    const response = await request(app)
      .delete("/payments/1")
      .set("authorization", "Bearer admin");
    const resAfterDeletion = await sqlite3.get(
      `SELECT * FROM wp_appq_payment_request WHERE id = 1`
    );
    expect(resAfterDeletion).toBe(undefined);
  });
  it("Should return 403 if payment_request is already paid", async () => {
    const resBeforeDeletion = await sqlite3.all(
      `SELECT * FROM wp_appq_payment_request`
    );

    const response = await request(app)
      .delete("/payments/2") //2 is the id of the payment_request that is already paid
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(403);

    const resAfterDeletion = await sqlite3.all(
      `SELECT * FROM wp_appq_payment_request`
    );
    expect(resAfterDeletion.length).toBe(resBeforeDeletion.length);
  });

  it("Should return 404 if user is admin and paymentId does not exist", async () => {
    const response = await request(app)
      .delete("/payments/69")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(404);
  });
});
