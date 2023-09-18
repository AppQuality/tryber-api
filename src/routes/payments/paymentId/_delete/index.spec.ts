import app from "@src/app";
import sqlite3 from "@src/features/sqlite";
import Attributions from "@src/__mocks__/mockedDb/attributions";
import { data as paymentRequestData } from "@src/__mocks__/mockedDb/paymentRequest";
import request from "supertest";
import { tryber } from "@src/features/database";

describe("DELETE /payments/{paymentId}", () => {
  beforeEach(async () => {
    await paymentRequestData.processingPaypalPayment({ id: 1, amount: 2 });
    await paymentRequestData.paidPaypalPayment({ id: 2 });
    await tryber.tables.WpAppqPayment.do().insert([
      {
        id: 1,
        request_id: 1,
        is_requested: 1,
      },
      {
        id: 2,
        request_id: 1,
        is_requested: 1,
      },
    ]);
  });

  afterEach(async () => {
    await paymentRequestData.drop();
    await tryber.tables.WpAppqPayment.do().delete();
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
    const resAfterDeletion = await tryber.tables.WpAppqPaymentRequest.do()
      .select()
      .where({ id: 1 });
    expect(resAfterDeletion).toHaveLength(0);
  });
  it("Should return 403 if payment_request is already paid", async () => {
    const resBeforeDeletion =
      await tryber.tables.WpAppqPaymentRequest.do().select();

    const response = await request(app)
      .delete("/payments/2") //2 is the id of the payment_request that is already paid
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(403);

    const resAfterDeletion =
      await tryber.tables.WpAppqPaymentRequest.do().select();

    expect(resAfterDeletion.length).toBe(resBeforeDeletion.length);
  });
  it("Should set the attribution of the payments as unrequested", async () => {
    const attributions = await Attributions.all();
    expect(attributions[0].is_requested).toBe(1);
    expect(attributions[1].is_requested).toBe(1);

    const response = await request(app)
      .delete("/payments/1")
      .set("authorization", "Bearer admin");

    const attributionsAfterDeletion = await Attributions.all();
    expect(attributionsAfterDeletion[0].is_requested).toBe(0);
    expect(attributionsAfterDeletion[1].is_requested).toBe(0);
  });
  it("Should return 404 if user is admin and paymentId does not exist", async () => {
    const response = await request(app)
      .delete("/payments/69")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(404);
  });
});
