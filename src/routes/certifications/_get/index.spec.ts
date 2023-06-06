import request from "supertest";
import app from "@src/app";
import { tryber } from "@src/features/database";

describe("GET /certifications", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqCertificationsList.do().insert([
      {
        id: 1,
        name: "Certification 1",
        area: "Area 1",
        institute: "Institute 1",
      },
      {
        id: 2,
        name: "Certification 2",
        area: "Area 2",
        institute: "Institute 2",
      },
    ]);
  });

  it("should return 403 if not logged in", async () => {
    const response = await request(app).get("/certifications");
    expect(response.status).toBe(403);
  });
  it("should return 200 if logged in", async () => {
    const response = await request(app)
      .get("/certifications")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
  });
  it("should return a list of certifications", async () => {
    const response = await request(app)
      .get("/certifications")
      .set("Authorization", "Bearer tester");
    expect(response.body).toEqual([
      {
        id: 1,
        name: "Certification 1",
        area: "Area 1",
        institute: "Institute 1",
      },
      {
        id: 2,
        name: "Certification 2",
        area: "Area 2",
        institute: "Institute 2",
      },
    ]);
  });

  it("should allow filtering by area", async () => {
    const response = await request(app)
      .get("/certifications?filterBy[area]=Area 1")
      .set("Authorization", "Bearer tester");
    expect(response.body).toEqual([
      {
        id: 1,
        name: "Certification 1",
        area: "Area 1",
        institute: "Institute 1",
      },
    ]);
  });
  it("should allow filtering by institute", async () => {
    const response = await request(app)
      .get("/certifications?filterBy[institute]=Institute 1")
      .set("Authorization", "Bearer tester");
    expect(response.body).toEqual([
      {
        id: 1,
        name: "Certification 1",
        area: "Area 1",
        institute: "Institute 1",
      },
    ]);
  });
  it("should allow filtering by multiple institutes", async () => {
    const response = await request(app)
      .get(
        "/certifications?filterBy[institute][]=Institute 1&filterBy[institute][]=Institute 2"
      )
      .set("Authorization", "Bearer tester");
    expect(response.body).toEqual([
      {
        id: 1,
        name: "Certification 1",
        area: "Area 1",
        institute: "Institute 1",
      },
      {
        id: 2,
        name: "Certification 2",
        area: "Area 2",
        institute: "Institute 2",
      },
    ]);
  });
});
