import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";
const fiscalProfile = {
  id: 1,
  tester_id: 1,
  fiscal_id: "JHNDOE90A01H501A",
  name: "Jhon",
  surname: "Doe",
  sex: "1",
  birth_date: "1990-01-01",
  city: "Milan",
  country: "Italy",
  province: "MI",
  address: "Dante Alighieri",
  address_number: "69",
  postal_code: "20123",
  birth_city: "Rome",
  birth_province: "RM",
  is_verified: 1,
  is_active: 1,
};
const paymentRequestPaypal = {
  id: 1,
  tester_id: 1,
  amount: 269,
  amount_gross: 300,
  paypal_email: "john.doe@example.com",
  is_paid: 1 as const,
  update_date: "1980-01-01 00:00:00",
  paid_date: "1980-01-01 00:00:00",
  under_threshold: 0,
  withholding_tax_percentage: 0,
  receipt_id: -1,
  fiscal_profile_id: 1,
};
const paymentRequestPaypalNotMine = {
  id: 6,
  tester_id: 2,
  amount: 269,
  amount_gross: 300,
  paypal_email: "john.doe@example.com",
  is_paid: 1 as const,
  update_date: "1980-01-01 00:00:00",
  paid_date: "1980-01-01 00:00:00",
  under_threshold: 0,
  withholding_tax_percentage: 0,
  receipt_id: -1,
  fiscal_profile_id: 1,
};
const paymentRequestWise = {
  id: 2,
  tester_id: 1,
  amount: 169,
  amount_gross: 200,
  iban: "DE12345678901234567890",
  is_paid: 1 as const,
  update_date: "1992-05-01 00:00:00",
  paid_date: "1992-05-01 00:00:00",
  receipt_id: 69,
  under_threshold: 0,
  withholding_tax_percentage: 0,
  fiscal_profile_id: 1,
};
const paymentRequestInvalid = {
  id: 3,
  tester_id: 1,
  amount: 69,
  amount_gross: 100,
  is_paid: 1 as const,
  update_date: "1979-05-03 00:00:00",
  paid_date: "1979-05-03 00:00:00",
  receipt_id: 69,
  under_threshold: 0,
  withholding_tax_percentage: 0,
  fiscal_profile_id: 1,
};
const paymentRequestPaypal2 = {
  id: 4,
  tester_id: 1,
  amount: 170,
  amount_gross: 200,
  is_paid: 1 as const,
  paypal_email: "john.doe@example.com",
  update_date: "1979-05-03 00:00:00",
  paid_date: "1979-05-03 00:00:00",
  receipt_id: 70,
  under_threshold: 0,
  withholding_tax_percentage: 0,
  fiscal_profile_id: 1,
};
const paymentRequestPaypalProcessing = {
  id: 5,
  tester_id: 1,
  amount: 49000,
  amount_gross: 50000,
  is_paid: 0 as const,
  paypal_email: "john.doe@example.com",
  update_date: "1979-05-03 00:00:00",
  paid_date: "1979-05-03 00:00:00",
  under_threshold: 0,
  withholding_tax_percentage: 0,
  receipt_id: -1,
  fiscal_profile_id: 1,
};
const receiptWise = {
  id: 69,
  url: "https://example.com/receiptWise",
  tester_id: 1,
};
const receiptPaypal = {
  id: 70,
  url: "https://example.com/receiptPaypal",
  tester_id: 1,
};
describe("GET /users/me/payments fiscalProfileCategory 1", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqPaymentRequest.do().insert([
      paymentRequestPaypal,
      paymentRequestWise,
      paymentRequestInvalid,
      paymentRequestPaypal2,
      paymentRequestPaypalNotMine,
      paymentRequestPaypalProcessing,
    ]);
    await tryber.tables.WpAppqReceipt.do().insert([receiptWise, receiptPaypal]);
    await tryber.tables.WpAppqFiscalProfile.do().insert({
      ...fiscalProfile,
      fiscal_category: 1,
    });
  });
  afterAll(async () => {
    await tryber.tables.WpAppqPaymentRequest.do().delete();
    await tryber.tables.WpAppqReceipt.do().delete();
    await tryber.tables.WpAppqFiscalProfile.do().delete();
  });

  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).get("/users/me/payments");
    expect(response.status).toBe(403);
  });
  it("Should answer 200 if logged in", async () => {
    const response = await request(app)
      .get("/users/me/payments")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
  });
  it("Should return all tryber payment requests", async () => {
    const response = await request(app)
      .get("/users/me/payments")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      results: [
        {
          amount: {
            gross: {
              currency: "EUR",
              value: 50000,
            },
            net: {
              currency: "EUR",
              value: 49000,
            },
          },
          id: 5,
          method: {
            note: "john.doe@example.com",
            type: "paypal",
          },
          paidDate: "-",
          status: "processing",
        },
        {
          amount: {
            gross: {
              currency: "EUR",
              value: 200,
            },
            net: {
              currency: "EUR",
              value: 169,
            },
          },
          id: 2,
          method: {
            note: "Iban ************567890",
            type: "iban",
          },
          paidDate: "1992-05-01",
          receipt: "https://example.com/receiptWise",
          status: "paid",
        },
        {
          amount: {
            gross: {
              currency: "EUR",
              value: 300,
            },
            net: {
              currency: "EUR",
              value: 269,
            },
          },
          id: 1,
          method: {
            note: "john.doe@example.com",
            type: "paypal",
          },
          paidDate: "1980-01-01",
          status: "paid",
        },
        {
          amount: {
            gross: {
              currency: "EUR",
              value: 200,
            },
            net: {
              currency: "EUR",
              value: 170,
            },
          },
          id: 4,
          method: {
            note: "john.doe@example.com",
            type: "paypal",
          },
          paidDate: "1979-05-03",
          receipt: "https://example.com/receiptPaypal",
          status: "paid",
        },
      ],
      size: 4,
      start: 0,
      limit: 25,
    });
  });
  it("Should return requests ordered ASC DESC if order is set", async () => {
    const responseAsc = await request(app)
      .get("/users/me/payments?order=ASC")
      .set("authorization", "Bearer tester");
    expect(responseAsc.status).toBe(200);
    expect(responseAsc.body.results.map((item: any) => item.id)).toEqual([
      4, 1, 2, 5,
    ]);
    const responseDesc = await request(app)
      .get("/users/me/payments?order=DESC")
      .set("authorization", "Bearer tester");
    expect(responseDesc.status).toBe(200);
    expect(responseDesc.body.results.map((item: any) => item.id)).toEqual([
      5, 2, 1, 4,
    ]);
  });
  it("Should return requests ordered by amount if orderBy=amount is set", async () => {
    const responseAsc = await request(app)
      .get("/users/me/payments?orderBy=amount&order=ASC")
      .set("authorization", "Bearer tester");
    expect(responseAsc.status).toBe(200);
    expect(responseAsc.body.results.map((item: any) => item.id)).toEqual([
      2, 4, 1, 5,
    ]);
    const responseDesc = await request(app)
      .get("/users/me/payments?orderBy=amount&order=DESC")
      .set("authorization", "Bearer tester");
    expect(responseDesc.status).toBe(200);
    expect(responseDesc.body.results.map((item: any) => item.id)).toEqual([
      5, 1, 4, 2,
    ]);
  });
  it("Should return requests ordered by request_date if orderBy=paidDate is set", async () => {
    const responseAsc = await request(app)
      .get("/users/me/payments?orderBy=paidDate&order=ASC")
      .set("authorization", "Bearer tester");
    expect(responseAsc.status).toBe(200);
    expect(responseAsc.body.results.map((item: any) => item.id)).toEqual([
      4, 1, 2, 5,
    ]);
    const responseDesc = await request(app)
      .get("/users/me/payments?orderBy=paidDate&order=DESC")
      .set("authorization", "Bearer tester");
    expect(responseDesc.status).toBe(200);
    expect(responseDesc.body.results.map((item: any) => item.id)).toEqual([
      5, 2, 1, 4,
    ]);
  });
  it("Should return requests ordered by request_date DESC by default", async () => {
    const responseDesc = await request(app)
      .get("/users/me/payments")
      .set("authorization", "Bearer tester");
    expect(responseDesc.status).toBe(200);
    expect(responseDesc.body.results.map((item: any) => item.id)).toEqual([
      5, 2, 1, 4,
    ]);
  });
  it("Should return 3 results if is set limit parameter with limit = 2", async () => {
    const response = await request(app)
      .get("/users/me/payments?limit=2")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("limit");
    expect(response.body.limit).toBe(2);
    expect(response.body.results.map((item: any) => item.id)).toEqual([5, 2]);

    const responseASC = await request(app)
      .get("/users/me/payments?limit=2&order=ASC")
      .set("authorization", "Bearer tester");
    expect(responseASC.status).toBe(200);
    expect(responseASC.body).toHaveProperty("limit");
    expect(responseASC.body.results.map((item: any) => item.id)).toEqual([
      4, 1,
    ]);

    const responseDESC = await request(app)
      .get("/users/me/payments?limit=2&order=DESC")
      .set("authorization", "Bearer tester");
    expect(responseDESC.status).toBe(200);
    expect(responseDESC.body).toHaveProperty("limit");
    expect(responseDESC.body.results.map((item: any) => item.id)).toEqual([
      5, 2,
    ]);
  });
  it("Should skip the first result if is set start=1 parameter", async () => {
    const response = await request(app)
      .get("/users/me/payments?start=1")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("start");
    expect(response.body.start).toBe(1);
    expect(response.body.results.map((item: any) => item.id)).toEqual([
      2, 1, 4,
    ]);

    const responseASC = await request(app)
      .get("/users/me/payments?start=1&order=ASC")
      .set("authorization", "Bearer tester");
    expect(responseASC.status).toBe(200);
    expect(responseASC.body).toHaveProperty("start");
    expect(responseASC.body.results.map((item: any) => item.id)).toEqual([
      1, 2, 5,
    ]);

    const responseDESC = await request(app)
      .get("/users/me/payments?start=1&order=DESC")
      .set("authorization", "Bearer tester");
    expect(responseDESC.status).toBe(200);
    expect(responseDESC.body).toHaveProperty("start");
    expect(responseDESC.body.results.map((item: any) => item.id)).toEqual([
      2, 1, 4,
    ]);
  });
  it("Should return the size that is equal to number of results", async () => {
    const response = await request(app)
      .get("/users/me/payments")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body.size).toBe(response.body.results.length);
    const responseStart = await request(app)
      .get("/users/me/payments?start=2&limit=2")
      .set("authorization", "Bearer tester");
    expect(responseStart.status).toBe(200);
    expect(responseStart.body.size).toBe(responseStart.body.results.length);
  });
  it("Should return the size of limit", async () => {
    const response = await request(app)
      .get("/users/me/payments?limit=50")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body.limit).toBe(50);
    expect(response.body).toHaveProperty("limit");
    const responseNoLimit = await request(app)
      .get("/users/me/payments")
      .set("authorization", "Bearer tester");
    expect(responseNoLimit.status).toBe(200);
    expect(responseNoLimit.body).toHaveProperty("limit");
    expect(responseNoLimit.body.limit).toBe(25);
  });
  it("Should return total of records only if limit is set", async () => {
    const response = await request(app)
      .get("/users/me/payments?limit=50")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("total");
    const responseNoLimit = await request(app)
      .get("/users/me/payments")
      .set("authorization", "Bearer tester");
    expect(responseNoLimit.status).toBe(200);
    expect(responseNoLimit.body).not.toHaveProperty("total");
  });
  it("Should return size and start", async () => {
    const response = await request(app)
      .get("/users/me/payments")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("size");
    expect(response.body.size).toBe(4);
    expect(response.body).toHaveProperty("start");
    expect(response.body.start).toBe(0);
  });
  it("Should return - as paidDate if status is processing", async () => {
    const response = await request(app)
      .get("/users/me/payments")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body.results[0].status).toBe("processing");
    response.body.results.forEach(
      (el: {
        id: number;
        status: string;
        amount: object;
        paidDate: string;
        method: object;
        receipt?: string;
      }) => {
        if (el.status === "processing") expect(el.paidDate).toEqual("-");
        else {
          expect(el.paidDate.length).toEqual(10);
          expect(el.paidDate).toMatch(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/); //YYYY-MM-DD
        }
      }
    );
  });
  it("Should return payments if fiscalProfile category 1", async () => {
    const response = await request(app)
      .get("/users/me/payments")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(
      response.body.results.every((r: { id: number }) =>
        [1, 2, 4, 5].includes(r.id)
      )
    ).toBe(true);
  });
});
describe("GET /users/me/payments fiscalProfileCategory 2", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqPaymentRequest.do().insert([
      paymentRequestPaypal,
      paymentRequestWise,
    ]);
    await tryber.tables.WpAppqReceipt.do().insert([receiptWise, receiptPaypal]);
    await tryber.tables.WpAppqFiscalProfile.do().insert({
      ...fiscalProfile,
      fiscal_category: 2,
    });
  });
  afterAll(async () => {
    await tryber.tables.WpAppqPaymentRequest.do().delete();
    await tryber.tables.WpAppqReceipt.do().delete();
    await tryber.tables.WpAppqFiscalProfile.do().delete();
  });

  it("Should return payments if fiscalProfile category is 2", async () => {
    const response = await request(app)
      .get("/users/me/payments")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(
      response.body.results.every((r: { id: number }) => [1, 2].includes(r.id))
    ).toBe(true);
  });
});
describe("GET /users/me/payments fiscalProfileCategory 3", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqPaymentRequest.do().insert([
      { ...paymentRequestPaypal, net_multiplier: 2 },
      { ...paymentRequestWise, net_multiplier: 2 },
    ]);
    await tryber.tables.WpAppqReceipt.do().insert([receiptWise, receiptPaypal]);
    await tryber.tables.WpAppqFiscalProfile.do().insert({
      ...fiscalProfile,
      fiscal_category: 3,
    });
  });
  afterAll(async () => {
    await tryber.tables.WpAppqPaymentRequest.do().delete();
    await tryber.tables.WpAppqReceipt.do().delete();
    await tryber.tables.WpAppqFiscalProfile.do().delete();
  });

  it("Should return payments if fiscalProfile category 3", async () => {
    const response = await request(app)
      .get("/users/me/payments")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(
      response.body.results.every((r: { id: number }) => [1, 2].includes(r.id))
    ).toBe(true);
  });
  it("Should return payments with net multiplied by net_multiplier", async () => {
    const response = await request(app)
      .get("/users/me/payments")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body.results[0].amount.net.value).toBe(338);
    expect(response.body.results[1].amount.net.value).toBe(538);
    expect(
      response.body.results.every((r: { id: number }) => [1, 2].includes(r.id))
    ).toBe(true);
  });
});
describe("GET /users/me/payments fiscalProfileCategory 4", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqPaymentRequest.do().insert([
      paymentRequestPaypal,
      paymentRequestWise,
    ]);
    await tryber.tables.WpAppqReceipt.do().insert([receiptWise, receiptPaypal]);
    await tryber.tables.WpAppqFiscalProfile.do().insert({
      ...fiscalProfile,
      fiscal_category: 4,
    });
  });
  afterAll(async () => {
    await tryber.tables.WpAppqPaymentRequest.do().delete();
    await tryber.tables.WpAppqReceipt.do().delete();
    await tryber.tables.WpAppqFiscalProfile.do().delete();
  });

  it("Should return payments if fiscalProfile category is 4", async () => {
    const response = await request(app)
      .get("/users/me/payments")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(
      response.body.results.every((r: { id: number }) => [1, 2].includes(r.id))
    ).toBe(true);
  });
});
describe("GET /users/me/payments fiscalProfileCategory 5", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqPaymentRequest.do().insert([
      paymentRequestPaypal,
      paymentRequestWise,
    ]);
    await tryber.tables.WpAppqReceipt.do().insert([receiptWise, receiptPaypal]);
    await tryber.tables.WpAppqFiscalProfile.do().insert({
      ...fiscalProfile,
      fiscal_category: 5,
    });
  });
  afterAll(async () => {
    await tryber.tables.WpAppqPaymentRequest.do().delete();
    await tryber.tables.WpAppqReceipt.do().delete();
    await tryber.tables.WpAppqFiscalProfile.do().delete();
  });

  it("Should return payments if fiscalProfile category is 5", async () => {
    const response = await request(app)
      .get("/users/me/payments")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(
      response.body.results.every((r: { id: number }) => [1, 2].includes(r.id))
    ).toBe(true);
  });
});

describe("GET /users/me/payments fiscalProfileCategory 6", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqPaymentRequest.do().insert([
      paymentRequestPaypal,
      paymentRequestWise,
    ]);
    await tryber.tables.WpAppqReceipt.do().insert([receiptWise, receiptPaypal]);
    await tryber.tables.WpAppqFiscalProfile.do().insert({
      ...fiscalProfile,
      fiscal_category: 6,
    });
  });
  afterAll(async () => {
    await tryber.tables.WpAppqPaymentRequest.do().delete();
    await tryber.tables.WpAppqReceipt.do().delete();
    await tryber.tables.WpAppqFiscalProfile.do().delete();
  });

  it("Should return payments if fiscalProfile category is 6", async () => {
    const response = await request(app)
      .get("/users/me/payments")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(
      response.body.results.every((r: { id: number }) => [1, 2].includes(r.id))
    ).toBe(true);
  });
});

describe("Route GET payment-requests when no data", () => {
  it("Should return 404", async () => {
    const response = await request(app)
      .get("/users/me/payments")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      element: "payments",
      id: 0,
      message: "No payments requests until now",
    });
  });
});
