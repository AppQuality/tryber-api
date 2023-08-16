import app from "@src/app";
import request from "supertest";
import { tryber } from "@src/features/database";

describe("Route GET popups", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqPopups.do().insert([
      {
        id: 1,
        title: "This is the POPUP title 1",
        targets: "italian",
        extras: "",
        content: "eyJST09ertgetrerbsfgUIjp",
        is_auto: 0,
      },
      {
        id: 2,
        title: "This is the POPUP title 2",
        targets: "list",
        extras: "",
        content: "eyJST09ertgetrerbsfgUIjp",
        is_auto: 0,
      },
      {
        id: 3,
        title: "This is the POPUP title 3",
        targets: "list",
        extras: "",
        content: "eyJST09ertgetrerbsfgUIjp",
        is_auto: 0,
      },
      {
        id: 4,
        title: "This is the POPUP title 4",
        targets: "list",
        extras: "",
        content: "eyJST09ertgetrerbsfgUIjp",
        is_auto: 1,
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqPopups.do().delete();
  });

  it("Should return all not automatic popups if user is admin", async () => {
    const response = await request(app)
      .get("/popups")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          title: "This is the POPUP title 1",
          content: "eyJST09ertgetrerbsfgUIjp",
          profiles: "italian",
        }),
        expect.objectContaining({
          id: 2,
          title: "This is the POPUP title 2",
          content: "eyJST09ertgetrerbsfgUIjp",
          profiles: [],
        }),
        expect.objectContaining({
          id: 3,
          title: "This is the POPUP title 3",
          content: "eyJST09ertgetrerbsfgUIjp",
          profiles: [],
        }),
      ])
    );
  });
  it("Should return all not automatic popups if user has appq_message_center permission", async () => {
    const response = await request(app)
      .get("/popups")
      .set("authorization", 'Bearer tester olp {"appq_message_center":true}');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          title: "This is the POPUP title 1",
          content: "eyJST09ertgetrerbsfgUIjp",
          profiles: "italian",
        }),
        expect.objectContaining({
          id: 2,
          title: "This is the POPUP title 2",
          content: "eyJST09ertgetrerbsfgUIjp",
          profiles: [],
        }),
        expect.objectContaining({
          id: 3,
          title: "This is the POPUP title 3",
          content: "eyJST09ertgetrerbsfgUIjp",
          profiles: [],
        }),
      ])
    );
  });
  it("Should return 403 if user has not appq_message_center permission", async () => {
    const response = await request(app)
      .get("/popups")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      element: "popups",
      id: 0,
      message: "You cannot list popups",
    });
  });
  it("Should return 2 popup if is set LIMIT=2 parameter", async () => {
    const response = await request(app)
      .get("/popups?limit=2")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
    expect(response.body.map((el: { id: 0 }) => el.id)).toEqual([1, 2]);
  });

  it("Should return 1 popup if is set start=2 an limit=1 parameter", async () => {
    const response = await request(app)
      .get("/popups?start=1&limit=1")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].id).toBe(2);
  });

  it("Should return all popups if user has full_access", async () => {
    const response = await request(app)
      .get("/popups")
      .set(
        "authorization",
        'Bearer tester olp {"appq_message_center_full_access":true}'
      );
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          title: "This is the POPUP title 1",
          content: "eyJST09ertgetrerbsfgUIjp",
          profiles: "italian",
        }),
        expect.objectContaining({
          id: 2,
          title: "This is the POPUP title 2",
          content: "eyJST09ertgetrerbsfgUIjp",
          profiles: [],
        }),
        expect.objectContaining({
          id: 3,
          title: "This is the POPUP title 3",
          content: "eyJST09ertgetrerbsfgUIjp",
          profiles: [],
        }),
      ])
    );
  });
});

describe("Route GET popups - when there are no popups", () => {
  it("Should answer 404 when there are no popups", async () => {
    const response = await request(app)
      .get("/popups")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      element: "popups",
      id: 0,
      message: "No popups found",
    });
  });
});
