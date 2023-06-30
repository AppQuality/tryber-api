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
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 9,
          title: "Title Agreement9",
          tokens: 165.65,
          unitPrice: 165,
          note: "Notes Agreement9",
          startDate: "2021-01-01 00:00:00",
          expirationDate: "2021-01-10 00:00:00",
          customer: {
            id: 9,
            company: "Company9",
          },
          isTokenBased: true,
        }),
        expect.objectContaining({
          id: 10,
          title: "Title Agreement10",
          tokens: 222.22,
          unitPrice: 165,
          startDate: "2021-01-01 00:00:00",
          expirationDate: "2021-01-10 00:00:00",
          customer: {
            id: 9,
            company: "Company9",
          },
          isTokenBased: false,
        }),
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
      ])
    );
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

describe("GET /agreements paginated", () => {
  useAgreementsData();
  it("Should return agreements limited to 1", async () => {
    const response = await request(app)
      .get("/agreements?limit=1")
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
