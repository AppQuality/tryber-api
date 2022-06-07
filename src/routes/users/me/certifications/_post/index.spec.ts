import { data as certificationData } from "@src/__mocks__/mockedDb/certificationList";
import { data as testerCertificationData } from "@src/__mocks__/mockedDb/testerCertification";
import { data as userMetaData } from "@src/__mocks__/mockedDb/wp_usermeta";
import app from "@src/app";
import request from "supertest";

describe("Route POST single-certification", () => {
  beforeEach(async () => {
    return new Promise(async (resolve) => {
      await certificationData.certification1();
      await certificationData.certification1({
        id: 2,
        name: "This is another Certification",
        area: "Testing",
        institute: "Germano Mosconi Tested",
      });
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
  it("Should return 201 the resource if a certification is sent", async () => {
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
  it("Should return an error if sending an inexistent certification", async () => {
    const response = await request(app)
      .post("/users/me/certifications")
      .send({ certification_id: 69, achievement_date: "2020-01-01" })
      .set("authorization", "Bearer tester");
    console.log(response.body);

    expect(response.status).toBe(400);
    console.log(response.body);
    expect(response.body).toMatchObject({
      id: 0,
      element: "certifications",
      message: "Can't find certification with id 69",
    });
  });
  it("Should return an error if send a certification that the user already owns", async () => {
    const response = await request(app)
      .post("/users/me/certifications")
      .send({ certification_id: 1, achievement_date: "2020-01-01" })
      .set("authorization", "Bearer tester");

    const responseTwinCertification = await request(app)
      .post("/users/me/certifications")
      .send({ certification_id: 1, achievement_date: "2020-01-01" })
      .set("authorization", "Bearer tester");

    expect(responseTwinCertification.status).toBe(400);
    expect(responseTwinCertification.body).toMatchObject({
      message:
        "Failed. Duplication entry. Certification already assigned to the tester.",
    });
  });
});
