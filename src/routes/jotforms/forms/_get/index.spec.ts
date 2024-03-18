import app from "@src/app";
import request from "supertest";

jest.mock("@src/features/jotform", () => {
  return jest.fn().mockImplementation(() => {
    return {
      getForms: async () => {
        return [
          {
            id: "2",
            name: "Form 2",
            createdAt: "2024-01-01 00:00:00",
          },
          {
            id: "1",
            name: "Form 1",
            createdAt: "2021-01-01 00:00:00",
          },
        ];
      },
    };
  });
});

describe("GET /jotforms/forms", () => {
  it("should answer 403 if user is not logged in ", async () => {
    const response = await request(app).get("/jotforms/forms/");
    expect(response.status).toBe(403);
  });
  it("should answer 403 if user is logged in without manage_preselection_forms ", async () => {
    const response = await request(app)
      .get("/jotforms/forms/")
      .set("authorization", `Bearer tester`);
    expect(response.status).toBe(403);
  });
  it("should return 200 if user is logged in with manage_preselection_forms permission", async () => {
    const response = await request(app)
      .get("/jotforms/forms/")
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );

    expect(response.status).toBe(200);
  });

  //
  it("should return forms oreder by creation_date DESC", async () => {
    const response = await request(app)
      .get("/jotforms/forms/")
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        id: "2",
        name: "Form 2",
        createdAt: "2024-01-01 00:00:00",
      },
      {
        id: "1",
        name: "Form 1",
        createdAt: "2021-01-01 00:00:00",
      },
    ]);
  });
});
