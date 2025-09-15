import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";
import useBasicData from "../../../_get/useBasicData";

describe("Route POST /users/me/campaigns/{campaignId}/tasks/{taskId}", () => {
  useBasicData();
  it("Should return 403 if user is not logged in", async () => {
    const res = await request(app)
      .post("/users/me/campaigns/1/tasks/1")
      .send({ status: "completed" });
    expect(res.status).toBe(403);
  });

  it("Should return 404 if user is logged in but not selected", async () => {
    const res = await request(app)
      .post("/users/me/campaigns/2/tasks/1")
      .send({ status: "completed" })
      .set("Authorization", "Bearer tester");
    expect(res.status).toBe(404);
  });

  it("Should return 403 if user is logged in but the task does not exist", async () => {
    const res = await request(app)
      .post("/users/me/campaigns/1/tasks/999")
      .send({ status: "completed" })
      .set("Authorization", "Bearer tester");
    expect(res.status).toBe(403);
  });

  describe("Check payload", () => {
    beforeEach(async () => {
      await tryber.tables.WpAppqUserTask.do().insert({
        id: 1,
        tester_id: 1,
        task_id: 1,
        is_completed: 0,
      });
    });
    afterEach(async () => {
      await tryber.tables.WpAppqUserTask.do().delete();
    });
    describe("Invalid body", () => {
      it("Should return 400 if status is missing", async () => {
        const response = await request(app)
          .post("/users/me/campaigns/1/tasks/1")
          .send({})
          .set("Authorization", "Bearer tester");
        expect(response.status).toBe(400);
      });

      it("Should return 400 if the body is missing", async () => {
        const response = await request(app)
          .post("/users/me/campaigns/1/tasks/1")
          .set("Authorization", " Bearer tester");
        expect(response.status).toBe(400);
      });

      it("Should return 400 if status is not valid", async () => {
        const response = await request(app)
          .post("/users/me/campaigns/1/tasks/1")
          .send({ status: "invalid_status" })
          .set("Authorization", " Bearer tester");
        expect(response.status).toBe(400);
      });

      it("Should return 400 if payload has incorrect fields", async () => {
        const response = await request(app)
          .post("/users/me/campaigns/1/tasks/1")
          .send({ wrong_field: "completed" })
          .set("Authorization", " Bearer tester");
        expect(response.status).toBe(400);
      });
    });

    describe("Valid body", () => {
      it("Should return 200 if user is logged and selected", async () => {
        const response = await request(app)
          .post("/users/me/campaigns/1/tasks/1")
          .send({ status: "completed" })
          .set("Authorization", "Bearer tester");
        expect(response.status).toBe(200);
      });
      it("Should return 200 if payload is valid", async () => {
        const valueBefore = await tryber.tables.WpAppqUserTask.do()
          .select("is_completed")
          .where({ id: 1 })
          .first();
        expect(valueBefore?.is_completed).toBe(0);

        const response = await request(app)
          .post("/users/me/campaigns/1/tasks/1")
          .send({ status: "completed" })
          .set("Authorization", " Bearer tester");
        expect(response.status).toBe(200);

        const valueAfter = await tryber.tables.WpAppqUserTask.do()
          .select("is_completed")
          .where({ id: 1 })
          .first();
        expect(valueAfter?.is_completed).toBe(1);
      });

      it("Should create the user task if it does not exist and return 200", async () => {
        const userTaskBefore = await tryber.tables.WpAppqUserTask.do()
          .select("*")
          .where({ tester_id: 1, task_id: 2 })
          .first();
        expect(userTaskBefore).toBeUndefined();

        const response = await request(app)
          .post("/users/me/campaigns/1/tasks/2")
          .send({ status: "completed" })
          .set("Authorization", "Bearer tester");

        expect(response.status).toBe(200);

        const userTaskAfter = await tryber.tables.WpAppqUserTask.do()
          .select("*")
          .where({ tester_id: 1, task_id: 2 })
          .first();
        expect(userTaskAfter).toBeDefined();
        expect(userTaskAfter?.is_completed).toBe(1);
        expect(userTaskAfter?.is_completed).toBe(1);
      });
    });
  });
});
