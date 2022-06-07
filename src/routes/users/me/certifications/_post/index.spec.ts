import { data as certificationData } from "@src/__mocks__/mockedDb/certificationList";
import { data as testerCertificationData } from "@src/__mocks__/mockedDb/testerCertification";
import { data as userMetaData } from "@src/__mocks__/mockedDb/wp_usermeta";
import app from "@src/app";
import request from "supertest";

describe("Route POST single-certification", () => {
  beforeEach(async () => {
    return new Promise(async (resolve) => {
      await certificationData.certification1();
      await userMetaData.basicMeta();

      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      await testerCertificationData.drop();
      await certificationData.drop();
      await userMetaData.drop();

      resolve(null);
    });
  });

  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).delete("/users/me/certifications/1");
    expect(response.status).toBe(403);
  });
  it("Should return 201 if send a certification", async () => {
    const response = await request(app)
      .post("/users/me/certifications")
      .send({ certification_id: 1, achievement_date: "2020-01-01" })
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: 1,
      name: "Best Tryber Ever",
      area: "Testing 360",
      institute: "Tryber",
      achievement_date: "2020-01-01",
    });
  });
  //new user doesn't have any certification and doesn't have emptyCerts meta
  // when add first certification, it should add emptyCerts meta to usermeta as false
  // if user remove all certifications, remain emptyCerts meta as false
});
