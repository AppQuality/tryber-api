import request from "supertest";
import app from "@src/app";
import useAgreementsData from "./useAgreementsData";

describe("GET /agreements", () => {
  useAgreementsData();

  it("Should return 403 if the user is not autorized", async () => {
    const response = await request(app)
      .get("/agreements")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });

  it("Should return 403 if the user has olp false", async () => {
    const response = await request(app)
      .get("/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":false}');
    expect(response.status).toBe(403);
  });

  it("Should return 403 if the user has partial olp", async () => {
    const response = await request(app)
      .get("/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1,2]');
    expect(response.status).toBe(403);
  });

  it("Should return 200 if the user has campaign full access", async () => {
    const response = await request(app)
      .get("/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
  });

  it("Should return 200 if the user is admin", async () => {
    const response = await request(app)
      .get("/agreements")
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(200);
  });

  it("Should return an array of agreements", async () => {
    const response = await request(app)
      .get("/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body.items).toBeDefined();
    expect(response.body.items).toBeInstanceOf(Array);
    expect(response.body.items.length).toBe(3);
  });

  it("Should return items with agreement id", async () => {
    const response = await request(app)
      .get("/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 9,
        }),
        expect.objectContaining({
          id: 10,
        }),
        expect.objectContaining({
          id: 11,
        }),
      ])
    );
  });
  it("Should return items with agreement title", async () => {
    const response = await request(app)
      .get("/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 9,
          title: "Title Agreement9",
        }),
        expect.objectContaining({
          id: 10,
          title: "Title Agreement10",
        }),
        expect.objectContaining({
          id: 11,
          title: "Title Agreement11",
        }),
      ])
    );
  });
  it("Should return items with agreement token", async () => {
    const response = await request(app)
      .get("/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 9,
          tokens: 165.65,
        }),
        expect.objectContaining({
          id: 10,
          tokens: 222.22,
        }),
        expect.objectContaining({
          id: 11,
          tokens: 111,
        }),
      ])
    );
  });
  it("Should return items with agreement unitPrice", async () => {
    const response = await request(app)
      .get("/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 9,
          unitPrice: 165,
        }),
        expect.objectContaining({
          id: 10,
          unitPrice: 165,
        }),
        expect.objectContaining({
          id: 11,
          unitPrice: 165,
        }),
      ])
    );
  });
  it("Should return items with agreement note if it is present", async () => {
    const response = await request(app)
      .get("/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 9,
          note: "Notes Agreement9",
        }),
        expect.objectContaining({
          id: 11,
          note: "Notes Agreement11",
        }),
      ])
    );
  });

  it("Should return items with agreement startDate", async () => {
    const response = await request(app)
      .get("/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 9,
          startDate: "2021-01-01 00:00:00",
        }),
        expect.objectContaining({
          id: 10,
          startDate: "2021-01-01 00:00:00",
        }),
        expect.objectContaining({
          id: 11,
          startDate: "2021-01-01 00:00:00",
        }),
      ])
    );
  });

  it("Should return items with agreement expirationDate", async () => {
    const response = await request(app)
      .get("/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 9,
          expirationDate: "2021-01-10 00:00:00",
        }),
        expect.objectContaining({
          id: 10,
          expirationDate: "2021-01-10 00:00:00",
        }),
        expect.objectContaining({
          id: 11,
          expirationDate: "2021-01-10 00:00:00",
        }),
      ])
    );
  });

  it("Should return items with agreement isTokenBased", async () => {
    const response = await request(app)
      .get("/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 9,
          isTokenBased: true,
        }),
        expect.objectContaining({
          id: 10,
          isTokenBased: false,
        }),
        expect.objectContaining({
          id: 11,
          isTokenBased: true,
        }),
      ])
    );
  });

  it("Should return items with agreement customer data", async () => {
    const response = await request(app)
      .get("/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 9,
          customer: {
            id: 9,
            company: "Company9",
          },
        }),
        expect.objectContaining({
          id: 10,
          customer: {
            id: 9,
            company: "Company9",
          },
        }),
        expect.objectContaining({
          id: 11,
          customer: {
            id: 11,
            company: "Company11",
          },
        }),
      ])
    );
  });

  it("Should return items without agreement note if it is not present", async () => {
    const response = await request(app)
      .get("/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(
      response.body.items.filter(
        (agreement: { id: number }) => agreement.id === 10
      )
    ).not.toHaveProperty("note");
  });

  it("Should return an array of agreements ordered by Agreement ID desc", async () => {
    const response = await request(app)
      .get("/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(
      response.body.items.map((agreement: { id: number }) => agreement.id)
    ).toEqual([11, 10, 9]);
  });
});

describe("GET /agreements when there are no agreements", () => {
  it("Should return an empty array if there are no agreements", async () => {
    const response = await request(app)
      .get("/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body.items).toEqual([]);
  });
});

describe("GET /agreements filtered by customerId", () => {
  useAgreementsData();
  it("Should return agreements filtered by customerIds", async () => {
    const response = await request(app)
      .get("/agreements?filterBy[customer]=11,66")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body.items).toEqual([
      expect.objectContaining({
        id: 11,
        title: "Title Agreement11",
        tokens: 111,
        unitPrice: 165,
        startDate: "2021-01-01 00:00:00",
        expirationDate: "2021-01-10 00:00:00",
        note: "Notes Agreement11",
        customer: {
          id: 11,
          company: "Company11",
        },
        isTokenBased: true,
      }),
    ]);
  });
});

describe("GET /agreements pagination", () => {
  useAgreementsData();

  it("Should return mandatory pagination data", async () => {
    const response = await request(app)
      .get("/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body.start).toBeDefined();
    expect(response.body.size).toBeDefined();
  });
  it("Should return agreements limited to 1 when limit is set to 1", async () => {
    const response = await request(app)
      .get("/agreements?limit=1")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body.items.length).toBe(1);
  });
  it("Should return limit = 1 when limit is set to 1", async () => {
    const response = await request(app)
      .get("/agreements?limit=1")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body.limit).toBeDefined();
    expect(response.body.limit).toBe(1);
  });

  it("Should not return limit if limit is not set", async () => {
    const response = await request(app)
      .get("/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body.limit).not.toBeDefined();
  });

  it("Should not return total if limit is not set", async () => {
    const response = await request(app)
      .get("/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body.total).not.toBeDefined();
  });

  it("Should return start = 0 (as default) if start is not set", async () => {
    const response = await request(app)
      .get("/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body.start).toBeDefined();
    expect(response.body.start).toBe(0);
  });

  it("Should return start = 1 if start is set to 1", async () => {
    const response = await request(app)
      .get("/agreements?start=1")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body.start).toBeDefined();
    expect(response.body.start).toBe(1);
  });

  it("Should return limited agreements if start is set", async () => {
    const response = await request(app)
      .get("/agreements?start=1")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body.start).toBeDefined();
    expect(response.body.items.length).toBe(2);
  });

  it("Should return total = 3 if limit is set", async () => {
    const response = await request(app)
      .get("/agreements?limit=1")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body.total).toBeDefined();
    expect(response.body.total).toBe(3);
  });

  it("Should return size = 1 if limit is 1 and there are more than one agreement", async () => {
    const response = await request(app)
      .get("/agreements?limit=1")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body.size).toBeDefined();
    expect(response.body.size).toBe(1);
  });

  it("Should return size = 3 if limit is 10 and there are only 3 agreements", async () => {
    const response = await request(app)
      .get("/agreements?limit=10")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body.size).toBeDefined();
    expect(response.body.size).toBe(3);
  });
});
