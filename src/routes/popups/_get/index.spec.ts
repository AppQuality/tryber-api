import {
  data as popupData,
  table as popupTable,
} from "@src/__mocks__/mockedDb/popups";
import app from "@src/app";
import request from "supertest";

jest.mock("@src/features/db");
jest.mock("@appquality/wp-auth");

describe("Route GET popups", () => {
  beforeAll(async () => {
    return new Promise(async (resolve) => {
      await popupTable.create();
      await popupData.insert({
        id: 1,
        content: "eyJST09ertgetrerbsfgUIjp",
        targets: "italian",
        title: "This is the Popup title",
      });
      await popupData.insert({
        id: 2,
        content: "eyJSdfnbgertbgreT09UIjp",
        targets: "list",
        title: "This is another Popup title",
      });
      await popupData.insert({
        id: 3,
        content: "eyJSdfnbgertbgreT09UIjp",
        targets: "list",
        title: "Stap Popup title please",
      });
      await popupData.insert({
        id: 4,
        content: "eyJSdfnbgertbgreT09UIjp",
        targets: "list",
        title: "This is an automatic Popup",
        is_auto: 1,
      });

      resolve(null);
    });
  });
  afterAll(async () => {
    return new Promise(async (resolve) => {
      await popupTable.drop();
      resolve(null);
    });
  });

  it("Should return all not autmatic popups if user has appq_message_center permission", async () => {
    const response = await request(app)
      .get("/popups")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        content: "eyJST09ertgetrerbsfgUIjp",
        id: 1,
        profiles: "italian",
        title: "This is the Popup title",
      },
      {
        content: "eyJSdfnbgertbgreT09UIjp",
        id: 2,
        profiles: [],
        title: "This is another Popup title",
      },
      {
        content: "eyJSdfnbgertbgreT09UIjp",
        id: 3,
        profiles: [],
        title: "Stap Popup title please",
      },
    ]);
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
});
