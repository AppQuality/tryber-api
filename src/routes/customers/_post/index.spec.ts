import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

describe("POST /customers", () => {
  beforeEach(async () => {
    jest.mock("axios");
    const axios = require("axios");
    axios.post.mockImplementation(async (url: string) => {
      if (url.includes("authenticate")) {
        return {
          data: {
            token: "token",
          },
        };
      } else if (url.includes("workspaces")) {
        const newCustomer = await tryber.tables.WpAppqCustomer.do()
          .insert({
            company: "New Customer",
            pm_id: 1,
          })
          .returning("id");
        return {
          data: {
            id: newCustomer[0].id,
            name: "New Customer",
          },
        };
      }
    });
  });

  afterEach(async () => {
    await tryber.tables.WpAppqCustomer.do().delete();
    jest.clearAllMocks();
  });

  it("Should answer 403 if not logged in", () => {
    return request(app)
      .post("/customers")
      .send({ name: "New project" })
      .expect(403);
  });
  it("Should answer 403 if logged in without permissions", async () => {
    const response = await request(app)
      .post("/customers")
      .send({ name: "New project" })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });
  it("Should answer 201 if logged as user with full access on campaigns", async () => {
    const response = await request(app)
      .post("/customers")
      .send({ name: "New project" })
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(201);
  });
  it("Should answer 403 if logged as user with access to some campaigns", async () => {
    const response = await request(app)
      .post("/customers")
      .send({ name: "New project" })
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1,2]}');
    expect(response.status).toBe(403);
  });

  it("Should add customer", async () => {
    const postResponse = await request(app)
      .post("/customers")
      .send({ name: "New project" })
      .set("Authorization", "Bearer admin");

    expect(postResponse.status).toBe(201);
    expect(postResponse.body).toHaveProperty("id");
    expect(postResponse.body).toHaveProperty("name");
    const { id, name } = postResponse.body;

    const getResponse = await request(app)
      .get("/customers")
      .set("Authorization", "Bearer admin");

    expect(getResponse.status).toBe(200);

    const customers = getResponse.body;
    expect(customers).toHaveLength(1);
    expect(customers[0].name).toBe(name);
    expect(customers[0].id).toBe(id);
  });
});
