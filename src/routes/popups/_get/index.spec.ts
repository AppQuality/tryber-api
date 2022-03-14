import app from "@src/app";
import sqlite3 from "@src/features/sqlite";
import request from "supertest";

jest.mock("@src/features/db");
jest.mock("@appquality/wp-auth");
const popup1 = {
  id: 1,
  content: "eyJST09ertgetrerbsfgUIjp",
  //is_once: 1,
  targets: "italian",
  //exstras: "",
  title: "This is the Popup title",
};
const popup2 = {
  id: 2,
  content: "eyJSdfnbgertbgreT09UIjp",
  //is_once: 1,
  targets: "list",
  //exstras: "",
  title: "This is another Popup title",
};
const popup3 = {
  id: 3,
  content: "eyJSdfnbgertbgreT09UIjp",
  //is_once: 1,
  targets: "list",
  //exstras: "",
  title: "Stap Popup title please",
};

describe("Route GET popups", () => {
  beforeAll(async () => {
    return new Promise(async (resolve) => {
      await sqlite3.createTable("wp_appq_popups", [
        "id INTEGER PRIMARY KEY",
        "content MEDIUMTEXT",
        "is_once INTEGER",
        "targets VARCHAR(32)",
        "exstras MEDIUMTEXT",
        "title VARCHAR(128)",
      ]);
      await sqlite3.insert("wp_appq_popups", popup1);
      await sqlite3.insert("wp_appq_popups", popup2);
      await sqlite3.insert("wp_appq_popups", popup3);
      resolve(null);
    });
  });
  afterAll(async () => {
    return new Promise(async (resolve) => {
      await sqlite3.dropTable("wp_appq_popups");
      resolve(null);
    });
  });

  it("Should return all popups if user has appq_message_center permission", async () => {
    const response = await request(app)
      .get("/popups")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
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
    console.log(response.body);
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].id).toBe(2);
  });
});
