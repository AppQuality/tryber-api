import { data as paymentRequestData } from "@src/__mocks__/mockedDb/paymentRequest";
import Profile from "@src/__mocks__/mockedDb/profile";
import app from "@src/app";
import { tryber } from "@src/features/database";
import sqlite3 from "@src/features/sqlite";
import request from "supertest";

const tester1 = {
  id: 1,
  wp_user_id: 1,
  name: "John",
  surname: "Doe",
  education_id: 1,
  employment_id: 1,
};
const tester2 = {
  id: 5,
  wp_user_id: 5,
  name: "Pippo",
  surname: "Franco",
  education_id: 1,
  employment_id: 1,
};
const tester3 = {
  id: 69,
  wp_user_id: 69,
  name: "Deleted User",
  education_id: 1,
  employment_id: 1,
};
const tester4fiscalCategory2 = {
  id: 10,
  wp_user_id: 10,
  name: "Mary",
  surname: "White",
  education_id: 1,
  employment_id: 1,
};
const tester5fiscalCategory4 = {
  id: 11,
  wp_user_id: 11,
  name: "Lana",
  surname: "Lang",
  education_id: 1,
  employment_id: 1,
};
const tester6fiscalCategory5 = {
  id: 12,
  wp_user_id: 12,
  name: "Beatrice",
  surname: "Portinari",
  education_id: 1,
  employment_id: 1,
};
const tester7fiscalCategory6 = {
  id: 13,
  wp_user_id: 13,
  name: "Luna",
  surname: "Lovegood",
  education_id: 1,
  employment_id: 1,
};

const paymentRequestPaypal = {
  id: 1,
  tester_id: tester1.id,
  amount: 100,
  paypal_email: "john.doe@example.com",
  is_paid: 0,
  request_date: new Date("01/01/1972").toISOString(),
  under_threshold: 0,
  withholding_tax_percentage: 0,
  fiscal_profile_id: 1,
};

const paymentRequestPaypalWithError = {
  id: 2,
  tester_id: tester1.id,
  amount: 100,
  paypal_email: "john.doe@example.com",
  is_paid: 0,
  request_date: new Date("05/05/1970").toISOString(),
  update_date: new Date("05/05/1970").toISOString(),
  error_message: "Error message",
  under_threshold: 0,
  withholding_tax_percentage: 0,
  fiscal_profile_id: 1,
};

const paymentRequestWise = {
  id: 3,
  tester_id: tester2.id,
  amount: 100,
  iban: "DE12345678901234567890",
  is_paid: 0,
  request_date: new Date("01/05/1970").toISOString(),
  under_threshold: 0,
  withholding_tax_percentage: 0,
  fiscal_profile_id: 1,
};

const paymentRequestWiseWithError = {
  id: 4,
  tester_id: tester2.id,
  amount: 100,
  iban: "DE12345678901234567890",
  is_paid: 0,
  request_date: new Date("01/06/1970").toISOString(),
  update_date: new Date("05/06/1970").toISOString(),
  error_message: "Error message",
  under_threshold: 0,
  withholding_tax_percentage: 0,
  fiscal_profile_id: 1,
};
const paymentRequestWisePaid = {
  id: 5,
  tester_id: tester2.id,
  amount: 69,
  iban: "DE12345678901234567890",
  is_paid: 1,
  request_date: new Date("01/06/1975").toISOString(),
  update_date: new Date("05/10/1975").toISOString(),
  under_threshold: 0,
  withholding_tax_percentage: 0,
  fiscal_profile_id: 1,
};
const paymentRequestInvalid = {
  id: 6,
  tester_id: tester1.id,
  amount: 69,
  is_paid: 0,
  request_date: new Date("01/06/2000").toISOString(),
  under_threshold: 0,
  withholding_tax_percentage: 0,
  fiscal_profile_id: 1,
};
const paymentRequestOldUser = {
  id: 7,
  tester_id: tester3.id,
  amount: 6969,
  is_paid: 0,
  iban: "DE12345678901234567869",
  request_date: new Date("01/06/2000").toISOString(),
  under_threshold: 0,
  withholding_tax_percentage: 0,
  fiscal_profile_id: 1,
};
const paymentRequestOldUserWithError = {
  id: 8,
  tester_id: tester3.id,
  amount: 6969,
  is_paid: 0,
  iban: "DE12345678901234567869",
  request_date: new Date("01/06/2000").toISOString(),
  update_date: new Date("05/06/1970").toISOString(),
  error_message: "Error message",
  under_threshold: 0,
  withholding_tax_percentage: 0,
  fiscal_profile_id: 1,
};
const paymentWiseFiscalCat2 = {
  id: 9,
  tester_id: tester2.id,
  amount: 100,
  iban: "DE12345678901234567890",
  is_paid: 1,
  request_date: new Date("01/05/1970").toISOString(),
  under_threshold: 0,
  withholding_tax_percentage: 0,
  fiscal_profile_id: 3,
};
const paymentWiseFiscalCat4 = {
  id: 10,
  tester_id: tester2.id,
  amount: 100,
  iban: "DE12345678901234567890",
  is_paid: 1,
  request_date: new Date("01/05/1970").toISOString(),
  update_date: new Date("05/06/1970").toISOString(),
  under_threshold: 0,
  withholding_tax_percentage: 0,
  fiscal_profile_id: 4,
};
const paymentWiseFiscalCat5 = {
  id: 11,
  tester_id: tester2.id,
  amount: 100,
  iban: "DE12345678901234567890",
  is_paid: 1,
  request_date: new Date("01/05/1970").toISOString(),
  under_threshold: 0,
  withholding_tax_percentage: 0,
  fiscal_profile_id: 5,
};

const paymentWiseFiscalCat6 = {
  id: 12,
  tester_id: tester2.id,
  amount: 100,
  iban: "DE12345678901234567890",
  is_paid: 1,
  request_date: new Date("01/05/1970").toISOString(),
  under_threshold: 0,
  withholding_tax_percentage: 0,
  fiscal_profile_id: 6,
};

describe("Route GET payments", () => {
  beforeAll(async () => {
    await Profile.insert(tester1);
    await Profile.insert(tester2);
    await Profile.insert(tester3);
    await Profile.insert(tester4fiscalCategory2);
    await Profile.insert(tester5fiscalCategory4);
    await Profile.insert(tester6fiscalCategory5);
    await Profile.insert(tester7fiscalCategory6);
    await tryber.tables.WpAppqFiscalProfile.do().insert([
      {
        id: 1,
        tester_id: tester1.id,
        name: "John",
        surname: "Doe",
        sex: "M",
        birth_date: "01/01/1972",
        fiscal_category: 1,
        is_active: 1,
      },
      {
        id: 2,
        tester_id: tester2.id,
        name: "Pippo",
        surname: "Franco",
        sex: "M",
        birth_date: "01/01/1972",
        fiscal_category: 3,
        is_active: 1,
      },
      {
        id: 3,
        tester_id: tester4fiscalCategory2.id,
        name: tester4fiscalCategory2.name,
        surname: tester4fiscalCategory2.surname,
        sex: "F",
        birth_date: "01/01/1972",
        fiscal_category: 2,
        is_active: 1,
      },
      {
        id: 4,
        tester_id: tester5fiscalCategory4.id,
        name: tester5fiscalCategory4.name,
        surname: tester5fiscalCategory4.surname,
        sex: "F",
        birth_date: "01/01/1972",
        fiscal_category: 4,
        is_active: 0,
      },
      {
        id: 5,
        tester_id: tester6fiscalCategory5.id,
        name: tester6fiscalCategory5.name,
        surname: tester6fiscalCategory5.surname,
        sex: "F",
        birth_date: "01/01/1972",
        fiscal_category: 5,
        is_active: 1,
      },
      {
        id: 6,
        tester_id: tester7fiscalCategory6.id,
        name: tester7fiscalCategory6.name,
        surname: tester7fiscalCategory6.surname,
        sex: "F",
        birth_date: "01/01/1972",
        fiscal_category: 6,
        is_active: 1,
      },
    ]);

    await sqlite3.insert("wp_appq_payment_request", paymentRequestPaypal);
    await sqlite3.insert("wp_appq_payment_request", paymentRequestWise);
    await sqlite3.insert("wp_appq_payment_request", paymentRequestWisePaid);
    await sqlite3.insert("wp_appq_payment_request", paymentRequestInvalid);
    await sqlite3.insert("wp_appq_payment_request", paymentRequestOldUser);
    await sqlite3.insert(
      "wp_appq_payment_request",
      paymentRequestOldUserWithError
    );
    await sqlite3.insert(
      "wp_appq_payment_request",
      paymentRequestPaypalWithError
    );
    await sqlite3.insert(
      "wp_appq_payment_request",
      paymentRequestWiseWithError
    );
    await sqlite3.insert("wp_appq_payment_request", paymentWiseFiscalCat2);
    await sqlite3.insert("wp_appq_payment_request", paymentWiseFiscalCat4);
    await sqlite3.insert("wp_appq_payment_request", paymentWiseFiscalCat5);
    await sqlite3.insert("wp_appq_payment_request", paymentWiseFiscalCat6);
  });
  afterAll(async () => {
    await Profile.clear();
    await paymentRequestData.drop();
    await tryber.tables.WpAppqFiscalProfile.do().delete();
  });

  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).get("/payments");
    expect(response.status).toBe(403);
  });
  it("Should answer 403 if logged in with a non-admin user", async () => {
    const response = await request(app)
      .get("/payments")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });
  it("Should answer 200 if logged in with an admin user", async () => {
    const response = await request(app)
      .get("/payments")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
  });
  it("Should answer with a list of payments on success", async () => {
    const response = await request(app)
      .get("/payments")
      .set("authorization", "Bearer admin");
    expect(response.body).toMatchObject({
      items: [
        {
          created: new Date(paymentRequestPaypal.request_date)
            .getTime()
            .toString(),
          id: paymentRequestPaypal.id,
          amount: {
            value: paymentRequestPaypal.amount,
            currency: "EUR",
          },
          type: "paypal",
          tryber: {
            id: tester1.id,
            name: tester1.name,
            surname: tester1.surname,
          },
        },
        {
          created: new Date(paymentRequestPaypalWithError.request_date)
            .getTime()
            .toString(),
          updated: new Date(paymentRequestPaypalWithError.update_date)
            .getTime()
            .toString(),
          id: paymentRequestPaypalWithError.id,
          amount: {
            value: paymentRequestPaypalWithError.amount,
            currency: "EUR",
          },
          type: "paypal",
          tryber: {
            id: tester1.id,
            name: tester1.name,
            surname: tester1.surname,
          },
          error: paymentRequestPaypalWithError.error_message,
        },
        {
          created: new Date(paymentRequestWise.request_date)
            .getTime()
            .toString(),
          id: paymentRequestWise.id,
          amount: {
            value: paymentRequestWise.amount,
            currency: "EUR",
          },
          type: "transferwise",
          tryber: {
            id: tester2.id,
            name: tester2.name,
            surname: tester2.surname,
          },
        },
        {
          created: new Date(paymentRequestWiseWithError.request_date)
            .getTime()
            .toString(),
          updated: new Date(paymentRequestWiseWithError.update_date)
            .getTime()
            .toString(),
          id: paymentRequestWiseWithError.id,
          amount: {
            value: paymentRequestWiseWithError.amount,
            currency: "EUR",
          },
          type: "transferwise",
          tryber: {
            id: tester2.id,
            name: tester2.name,
            surname: tester2.surname,
          },
          error: paymentRequestWiseWithError.error_message,
        },
        {
          created: new Date(paymentRequestWisePaid.request_date)
            .getTime()
            .toString(),
          updated: new Date(paymentRequestWisePaid.update_date)
            .getTime()
            .toString(),
          id: paymentRequestWisePaid.id,
          amount: {
            value: paymentRequestWisePaid.amount,
            currency: "EUR",
          },
          type: "transferwise",
          tryber: {
            id: tester2.id,
            name: tester2.name,
            surname: tester2.surname,
          },
        },
        {
          created: new Date(paymentWiseFiscalCat4.request_date)
            .getTime()
            .toString(),
          updated: new Date(paymentWiseFiscalCat4.update_date)
            .getTime()
            .toString(),
          id: paymentWiseFiscalCat4.id,
          amount: {
            value: paymentWiseFiscalCat4.amount,
            currency: "EUR",
          },
          type: "transferwise",
          tryber: {
            id: tester2.id,
            name: tester2.name,
            surname: tester2.surname,
          },
        },
      ],
    });
  });
  it("Should order based on order parameters", async () => {
    const responseAsc = await request(app)
      .get("/payments?order=ASC")
      .set("authorization", "Bearer admin");
    expect(responseAsc.status).toBe(200);
    expect(responseAsc.body.items.map((item: any) => item.id)).toEqual([
      1, 2, 3, 4, 5, 10,
    ]);
    const responseDesc = await request(app)
      .get("/payments?order=DESC")
      .set("authorization", "Bearer admin");
    expect(responseDesc.status).toBe(200);
    expect(responseDesc.body.items.map((item: any) => item.id)).toEqual([
      10, 5, 4, 3, 2, 1,
    ]);
  });
  it("Should order based on id if orderBy is id", async () => {
    const response = await request(app)
      .get("/payments?orderBy=id")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
    expect(response.body.items.map((item: any) => item.id)).toEqual([
      1, 2, 3, 4, 5, 10,
    ]);
    const responseAsc = await request(app)
      .get("/payments?orderBy=id&order=ASC")
      .set("authorization", "Bearer admin");
    expect(responseAsc.status).toBe(200);
    expect(responseAsc.body.items.map((item: any) => item.id)).toEqual([
      1, 2, 3, 4, 5, 10,
    ]);
    const responseDesc = await request(app)
      .get("/payments?orderBy=id&order=DESC")
      .set("authorization", "Bearer admin");
    expect(responseDesc.status).toBe(200);
    expect(responseDesc.body.items.map((item: any) => item.id)).toEqual([
      10, 5, 4, 3, 2, 1,
    ]);
  });
  it("Should order based on creation time if orderBy is created", async () => {
    const response = await request(app)
      .get("/payments?orderBy=created")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
    expect(response.body.items.map((item: any) => item.id)).toEqual([
      3, 10, 4, 2, 1, 5,
    ]);
    const responseAsc = await request(app)
      .get("/payments?orderBy=created&order=ASC")
      .set("authorization", "Bearer admin");
    expect(responseAsc.status).toBe(200);
    expect(responseAsc.body.items.map((item: any) => item.id)).toEqual([
      3, 10, 4, 2, 1, 5,
    ]);
    const responseDesc = await request(app)
      .get("/payments?orderBy=created&order=DESC")
      .set("authorization", "Bearer admin");
    expect(responseDesc.status).toBe(200);
    expect(responseDesc.body.items.map((item: any) => item.id)).toEqual([
      5, 1, 2, 4, 3, 10,
    ]);
  });
  it("Should return 400 if status is not failed and orderBy is updated", async () => {
    const response = await request(app)
      .get("/payments?orderBy=updated")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(400);
    const responsePending = await request(app)
      .get("/payments?orderBy=updated&status=pending")
      .set("authorization", "Bearer admin");
    expect(responsePending.status).toBe(400);
  });
  it("Should return payments with error if status is failed", async () => {
    const response = await request(app)
      .get("/payments?status=failed")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      items: [
        {
          created: new Date(paymentRequestPaypalWithError.request_date)
            .getTime()
            .toString(),
          updated: new Date(paymentRequestPaypalWithError.update_date)
            .getTime()
            .toString(),
          id: paymentRequestPaypalWithError.id,
          amount: {
            value: paymentRequestPaypalWithError.amount,
            currency: "EUR",
          },
          type: "paypal",
          tryber: {
            id: tester1.id,
            name: tester1.name,
            surname: tester1.surname,
          },
          error: paymentRequestPaypalWithError.error_message,
        },
        {
          created: new Date(paymentRequestWiseWithError.request_date)
            .getTime()
            .toString(),
          updated: new Date(paymentRequestWiseWithError.update_date)
            .getTime()
            .toString(),
          id: paymentRequestWiseWithError.id,
          amount: {
            value: paymentRequestWiseWithError.amount,
            currency: "EUR",
          },
          type: "transferwise",
          tryber: {
            id: tester2.id,
            name: tester2.name,
            surname: tester2.surname,
          },
          error: paymentRequestWiseWithError.error_message,
        },
      ],
    });
  });
  it("Should return payments not paid if status is pending", async () => {
    const response = await request(app)
      .get("/payments?status=pending")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      items: [
        {
          created: new Date(paymentRequestPaypal.request_date)
            .getTime()
            .toString(),
          id: paymentRequestPaypal.id,
          amount: {
            value: paymentRequestPaypal.amount,
            currency: "EUR",
          },
          type: "paypal",
          tryber: {
            id: tester1.id,
            name: tester1.name,
            surname: tester1.surname,
          },
        },
        {
          created: new Date(paymentRequestWise.request_date)
            .getTime()
            .toString(),
          id: paymentRequestWise.id,
          amount: {
            value: paymentRequestWise.amount,
            currency: "EUR",
          },
          type: "transferwise",
          tryber: {
            id: tester2.id,
            name: tester2.name,
            surname: tester2.surname,
          },
        },
      ],
    });
  });
  it("Should order based on updated time if orderBy is updated and status is failed", async () => {
    const response = await request(app)
      .get("/payments?orderBy=updated&status=failed")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
    expect(response.body.items.map((item: any) => item.id)).toEqual([2, 4]);
    const responseAsc = await request(app)
      .get("/payments?orderBy=updated&status=failed&order=ASC")
      .set("authorization", "Bearer admin");
    expect(responseAsc.status).toBe(200);
    expect(responseAsc.body.items.map((item: any) => item.id)).toEqual([2, 4]);
    const responseDesc = await request(app)
      .get("/payments?orderBy=updated&status=failed&order=DESC")
      .set("authorization", "Bearer admin");
    expect(responseDesc.status).toBe(200);
    expect(responseDesc.body.items.map((item: any) => item.id)).toEqual([4, 2]);
  });
  it("Should return 2 results if is set limit parameter with limit = 2", async () => {
    const response = await request(app)
      .get("/payments?limit=2")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
    expect(response.body.items.map((item: any) => item.id)).toEqual([1, 2]);
    const responseASC = await request(app)
      .get("/payments?limit=2&order=ASC")
      .set("authorization", "Bearer admin");
    expect(responseASC.status).toBe(200);
    expect(responseASC.body.items.map((item: any) => item.id)).toEqual([1, 2]);
    const responseDESC = await request(app)
      .get("/payments?limit=2&order=DESC")
      .set("authorization", "Bearer admin");
    expect(responseDESC.status).toBe(200);
    expect(responseDESC.body.items.map((item: any) => item.id)).toEqual([
      10, 5,
    ]);
  });
  it("Should skip the first result if is set start parameter with start = 1", async () => {
    const response = await request(app)
      .get("/payments?start=1")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
    expect(response.body.items.map((item: any) => item.id)).toEqual([
      2, 3, 4, 5, 10,
    ]);
    const responseASC = await request(app)
      .get("/payments?start=1&order=ASC")
      .set("authorization", "Bearer admin");
    expect(responseASC.status).toBe(200);
    expect(responseASC.body.items.map((item: any) => item.id)).toEqual([
      2, 3, 4, 5, 10,
    ]);
    const responseDESC = await request(app)
      .get("/payments?start=1&order=DESC")
      .set("authorization", "Bearer admin");
    expect(responseDESC.status).toBe(200);
    expect(responseDESC.body.items.map((item: any) => item.id)).toEqual([
      5, 4, 3, 2, 1,
    ]);
  });
  it("should return only corresponding requests if filterBy method is set", async () => {
    const responsePaypal = await request(app)
      .get("/payments?filterBy[paymentMethod]=paypal")
      .set("authorization", "Bearer admin");
    expect(responsePaypal.status).toBe(200);
    expect(responsePaypal.body.items.map((item: any) => item.id)).toEqual([
      1, 2,
    ]);
    const responseTrasferwise = await request(app)
      .get("/payments?filterBy[paymentMethod]=transferwise")
      .set("authorization", "Bearer admin");
    expect(responseTrasferwise.status).toBe(200);
    expect(responseTrasferwise.body.items.map((item: any) => item.id)).toEqual([
      3, 4, 5, 10,
    ]);
  });
  it("Should skip the first result and limit 2 results if are set start and limit parameters with start 1, limit 2", async () => {
    const response = await request(app)
      .get("/payments?start=1&limit=2")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
    expect(response.body.items.map((item: any) => item.id)).toEqual([2, 3]);
    const responseASC = await request(app)
      .get("/payments?start=1&limit=2&order=ASC")
      .set("authorization", "Bearer admin");
    expect(responseASC.status).toBe(200);
    expect(responseASC.body.items.map((item: any) => item.id)).toEqual([2, 3]);
    const responseDESC = await request(app)
      .get("/payments?start=1&limit=2&order=DESC")
      .set("authorization", "Bearer admin");
    expect(responseDESC.status).toBe(200);
    expect(responseDESC.body.items.map((item: any) => item.id)).toEqual([5, 4]);
  });
  it("Should return the size that is equal to number of results", async () => {
    const response = await request(app)
      .get("/payments")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
    expect(response.body.size).toBe(response.body.items.length);
    const responseStart = await request(app)
      .get("/payments?start=2&limit=2")
      .set("authorization", "Bearer admin");
    expect(responseStart.status).toBe(200);
    expect(responseStart.body.size).toBe(responseStart.body.items.length);
    const responsePending = await request(app)
      .get("/payments?status=pending")
      .set("authorization", "Bearer admin");
    expect(responsePending.status).toBe(200);
    expect(responsePending.body.size).toBe(responsePending.body.items.length);
  });
  it("Should return number of skipped elements", async () => {
    const response = await request(app)
      .get("/payments")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
    expect(response.body.start).toBe(0);
    const responseStart = await request(app)
      .get("/payments?start=2")
      .set("authorization", "Bearer admin");
    expect(responseStart.status).toBe(200);
    expect(responseStart.body.start).toBe(2);
  });
  it("Should return the size of limit if limit is set", async () => {
    const response = await request(app)
      .get("/payments?limit=50")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
    expect(response.body.limit).toBe(50);
    const responseNoLimit = await request(app)
      .get("/payments")
      .set("authorization", "Bearer admin");
    expect(responseNoLimit.status).toBe(200);
    expect(responseNoLimit.body).not.toHaveProperty("limit");
  });
  it("Should return the total number of elements if limit is set", async () => {
    const response = await request(app)
      .get("/payments?limit=1")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("total");
    expect(response.body.total).toBe(9);
    const responseNoLimit = await request(app)
      .get("/payments")
      .set("authorization", "Bearer admin");
    expect(responseNoLimit.status).toBe(200);
    expect(responseNoLimit.body).not.toHaveProperty("total");
    const responseFail = await request(app)
      .get("/payments?status=failed&limit=1")
      .set("authorization", "Bearer admin");
    expect(responseFail.status).toBe(200);
    expect(responseFail.body.total).toBe(2);
    const responsePending = await request(app)
      .get("/payments?status=pending&limit=1")
      .set("authorization", "Bearer admin");
    expect(responsePending.status).toBe(200);
    expect(responsePending.body.total).toBe(2);
  });
  it("Should return only payments with fiscal category 1 or 4", async () => {
    const response = await request(app)
      .get("/payments")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
    expect(response.body.items.map((item: any) => item.id)).toEqual([
      1, 2, 3, 4, 5, 10,
    ]);
  });
});

describe("Route GET payments when no data", () => {
  beforeAll(async () => {
    await Profile.insert(tester1);
    await Profile.insert(tester2);
  });

  afterAll(async () => {
    await Profile.clear();
  });
  it("Should return 404", async () => {
    const response = await request(app)
      .get("/payments")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(404);
  });
});
