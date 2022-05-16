import {
  data as popupData,
  table as popupTable,
} from "@src/__mocks__/mockedDb/popups";
import app from "@src/app";
import request from "supertest";

jest.mock("@src/features/db");
jest.mock("@appquality/wp-auth");

describe("Route GET popups", () => {
  const data: { [key: string]: any } = {};
  beforeAll(async () => {
    return new Promise(async (resolve) => {
      await popupTable.create();
      data.popup1 = await popupData.basicPopup({
        id: 1,
        targets: "italian",
      });
      data.popup2 = await popupData.basicPopup({
        id: 2,
      });
      data.popup3 = await popupData.basicPopup({
        id: 3,
      });
      data.popup4 = await popupData.basicPopup({
        id: 4,
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

  it("Should return all not automatic popups if user has appq_message_center permission", async () => {
    const response = await request(app)
      .get("/popups")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        content: data.popup1.content,
        id: data.popup1.id,
        profiles: "italian",
        title: data.popup1.title,
      },
      {
        content: data.popup2.content,
        id: data.popup2.id,
        profiles: [],
        title: data.popup2.title,
      },
      {
        content: data.popup3.content,
        id: data.popup3.id,
        profiles: [],
        title: data.popup3.title,
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
