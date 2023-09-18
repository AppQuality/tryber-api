import app from "@src/app";
import request from "supertest";
import { tryber } from "@src/features/database";

const profile = {
  id: 1,
  wp_user_id: 1,
  name: "Jhon",
  surname: "Doe",
  birth_date: "1990-01-01",
  phone_number: "123456789",
  city: "Milan",
  address: "Via Roma 1",
  country: "Italy",
  postal_code: 12345,
  email: "jhondoe@tryber.me",
  employment_id: 1,
  education_id: 1,
  last_login: new Date().toISOString().slice(0, 19).replace("T", " "),
  last_activity: new Date().toISOString().slice(0, 19).replace("T", " "),
  sex: 1,
  is_verified: 1,
  total_exp_pts: 9000,
  onboarding_complete: 1,
};
jest.mock("avatar-initials", () => {
  return {
    gravatarUrl: jest.fn(
      ({
        fallback,
        email,
        size,
      }: {
        fallback: string;
        email: string;
        size: number;
      }) => `${fallback}---${email}---${size}`
    ),
  };
});
describe("GET /users/me - fields", () => {
  beforeEach(async () => {
    await tryber.tables.WpAppqEvdProfile.do().insert(profile);
    await tryber.tables.WpUsers.do().insert({ ID: 1, user_login: "jhon.doe" });
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
    await tryber.tables.WpAppqProfileCertifications.do().insert([
      {
        id: 1,
        tester_id: 1,
        cert_id: 1,
        achievement_date: new Date("01/01/2021")
          .toISOString()
          .slice(0, 19)
          .replace("T", " "),
      },
      {
        id: 2,
        tester_id: 1,
        cert_id: 2,
        achievement_date: new Date("01/01/2021")
          .toISOString()
          .slice(0, 19)
          .replace("T", " "),
      },
      {
        id: 3,
        tester_id: 2,
        cert_id: 2,
        achievement_date: new Date("01/01/2021")
          .toISOString()
          .slice(0, 19)
          .replace("T", " "),
      },
    ]);
    await tryber.tables.WpUsermeta.do().insert({
      user_id: 1,
      meta_key: "emptyCerts",
      meta_value: "true",
    });
    await tryber.tables.WpAppqLang.do().insert([
      {
        id: 1,
        display_name: "English",
        lang_code: "en",
      },
      {
        id: 2,
        display_name: "Sicilian",
        lang_code: "scn",
      },
      {
        id: 3,
        display_name: "Ukrainian",
        lang_code: "ukr",
      },
    ]);
    await tryber.tables.WpAppqProfileHasLang.do().insert([
      {
        profile_id: 1,
        language_id: 1,
      },
      {
        profile_id: 1,
        language_id: 2,
      },
    ]);
  });

  afterEach(async () => {
    await tryber.tables.WpAppqEvdProfile.do().delete();
    await tryber.tables.WpUsers.do().delete();
    await tryber.tables.WpAppqCertificationsList.do().delete();
    await tryber.tables.WpAppqProfileCertifications.do().delete();
    await tryber.tables.WpUsermeta.do().delete();
    await tryber.tables.WpAppqLang.do().delete();
    await tryber.tables.WpAppqProfileHasLang.do().delete();
  });

  it("Should return name, id, role if set fields=name", async () => {
    const response = await request(app)
      .get("/users/me?fields=name")
      .set("authorization", "Bearer tester");
    expect(Object.keys(response.body).length).toEqual(3);
    expect(response.body.id).toBeDefined();
    expect(response.body.name).toBeDefined();
    expect(response.body.role).toBeDefined();
    expect(response.body).toEqual({
      id: 1,
      name: profile.name,
      role: "tester",
    });
  });
  it("Should return surname, id, role if set fields=surname", async () => {
    const response = await request(app)
      .get("/users/me?fields=surname")
      .set("authorization", "Bearer tester");
    expect(Object.keys(response.body).length).toEqual(3);
    expect(response.body.id).toBeDefined();
    expect(response.body.surname).toBeDefined();
    expect(response.body.role).toBeDefined();
    expect(response.body).toEqual({
      id: 1,
      surname: profile.surname,
      role: "tester",
    });
  });
  it("Should return email, id, role if set fields=email", async () => {
    const response = await request(app)
      .get("/users/me?fields=email")
      .set("authorization", "Bearer tester");
    expect(Object.keys(response.body).length).toEqual(3);
    expect(response.body.id).toBeDefined();
    expect(response.body.email).toBeDefined();
    expect(response.body.role).toBeDefined();
    expect(response.body).toEqual({
      id: 1,
      email: profile.email,
      role: "tester",
    });
  });
  it("Should return wp_user_id, id, role if set fields=wp_user_id", async () => {
    const response = await request(app)
      .get("/users/me?fields=wp_user_id")
      .set("authorization", "Bearer tester");
    expect(Object.keys(response.body).length).toEqual(3);
    expect(response.body.id).toBeDefined();
    expect(response.body.wp_user_id).toBeDefined();
    expect(response.body.role).toBeDefined();
    expect(response.body).toEqual({
      id: 1,
      wp_user_id: profile.wp_user_id,
      role: "tester",
    });
  });
  it("Should return is_verified, id, role if set fields=is_verified", async () => {
    const response = await request(app)
      .get("/users/me?fields=is_verified")
      .set("authorization", "Bearer tester");
    expect(Object.keys(response.body).length).toEqual(3);
    expect(response.body.id).toBeDefined();
    expect(response.body.is_verified).toBeDefined();
    expect(response.body.role).toBeDefined();
    expect(response.body).toEqual({
      id: 1,
      is_verified: true,
      role: "tester",
    });
  });
  it("Should return username, id, role if set fields=username", async () => {
    const response = await request(app)
      .get("/users/me?fields=username")
      .set("authorization", "Bearer tester");
    expect(Object.keys(response.body).length).toEqual(3);
    expect(response.body.id).toBeDefined();
    expect(response.body.username).toBeDefined();
    expect(response.body.role).toBeDefined();
    expect(response.body).toEqual({
      id: 1,
      username: "jhon.doe",
      role: "tester",
    });
  });
  it("Should return gender, id, role if set fields=gender", async () => {
    const response = await request(app)
      .get("/users/me?fields=gender")
      .set("authorization", "Bearer tester");
    expect(Object.keys(response.body).length).toEqual(3);
    expect(response.body.id).toBeDefined();
    expect(response.body.gender).toBeDefined();
    expect(response.body.role).toBeDefined();
    expect(response.body).toEqual({
      id: 1,
      gender: "male",
      role: "tester",
    });
  });
  it("Should return phone, id, role if set fields=phone", async () => {
    const response = await request(app)
      .get("/users/me?fields=phone")
      .set("authorization", "Bearer tester");
    expect(Object.keys(response.body).length).toEqual(3);
    expect(response.body.id).toBeDefined();
    expect(response.body.phone).toBeDefined();
    expect(response.body.role).toBeDefined();
    expect(response.body).toEqual({
      id: 1,
      phone: profile.phone_number,
      role: "tester",
    });
  });
  it("Should return birth, id, role if set fields=birthDate", async () => {
    const response = await request(app)
      .get("/users/me?fields=birthDate")
      .set("authorization", "Bearer tester");
    expect(Object.keys(response.body).length).toEqual(3);
    expect(response.body.id).toBeDefined();
    expect(response.body.birthDate).toBeDefined();
    expect(response.body.role).toBeDefined();
    expect(response.body).toEqual({
      id: 1,
      birthDate: profile.birth_date,
      role: "tester",
    });
  });
  it("Should return total_exp_pts, id, role if set fields=total_exp_pts", async () => {
    const response = await request(app)
      .get("/users/me?fields=total_exp_pts")
      .set("authorization", "Bearer tester");
    expect(Object.keys(response.body).length).toEqual(3);
    expect(response.body.id).toBeDefined();
    expect(response.body.total_exp_pts).toBeDefined();
    expect(response.body.role).toBeDefined();
    expect(response.body).toEqual({
      id: 1,
      total_exp_pts: profile.total_exp_pts,
      role: "tester",
    });
  });
  it("Should return country, id, role if set fields=country", async () => {
    const response = await request(app)
      .get("/users/me?fields=country")
      .set("authorization", "Bearer tester");
    expect(Object.keys(response.body).length).toEqual(3);
    expect(response.body.id).toBeDefined();
    expect(response.body.country).toBeDefined();
    expect(response.body.role).toBeDefined();
    expect(response.body).toEqual({
      id: 1,
      country: profile.country,
      role: "tester",
    });
  });
  it("Should return city, id, role if set fields=city", async () => {
    const response = await request(app)
      .get("/users/me?fields=city")
      .set("authorization", "Bearer tester");
    expect(Object.keys(response.body).length).toEqual(3);
    expect(response.body.id).toBeDefined();
    expect(response.body.city).toBeDefined();
    expect(response.body.role).toBeDefined();
    expect(response.body).toEqual({
      id: 1,
      city: profile.city,
      role: "tester",
    });
  });
  it("Should return onboarding_completed, id, role if set fields=onboarding_completed", async () => {
    const response = await request(app)
      .get("/users/me?fields=onboarding_completed")
      .set("authorization", "Bearer tester");
    expect(Object.keys(response.body).length).toEqual(3);
    expect(response.body.id).toBeDefined();
    expect(response.body.onboarding_completed).toBeDefined();
    expect(response.body.role).toBeDefined();
    expect(response.body).toEqual({
      id: 1,
      onboarding_completed: true,
      role: "tester",
    });
  });
  it("Should return image location, id, role if set fields=image", async () => {
    const response = await request(app)
      .get("/users/me?fields=image")
      .set("authorization", "Bearer tester");
    expect(Object.keys(response.body).length).toEqual(3);
    expect(response.body.id).toBeDefined();
    expect(response.body.image).toBeDefined();
    expect(response.body.role).toBeDefined();
    expect(response.body).toEqual({
      id: 1,
      image: "https://eu.ui-avatars.com/api/j+d/132---jhondoe@tryber.me---132",
      role: "tester",
    });
  });
  it("should return only tester id and role and accepted fields if the fields parameter has multiple options fields=name,home,email", async () => {
    const response = await request(app)
      .get("/users/me?fields=name,home,email")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("name");
    expect(response.body).toHaveProperty("email");
    expect(response.body).toHaveProperty("role");
    expect(response.body).not.toHaveProperty("home");
    expect(response.body).toEqual({
      id: 1,
      role: "tester",
      name: "Jhon",
      email: "jhondoe@tryber.me",
    });
  });
  it("Should return certifications if parameter fields=certifications", async () => {
    const response = await request(app)
      .get("/users/me?fields=certifications")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("certifications");
    expect(response.body).toHaveProperty("role");
    expect(Array.isArray(response.body.certifications)).toBe(true);
    expect(response.body.certifications[0]).toMatchObject({
      id: 1,
      name: "Certification 1",
      area: "Area 1",
      institute: "Institute 1",
      achievement_date: "2020-12-31",
    });
  });
  it("Should return languages if parameter fields=languages", async () => {
    const response = await request(app)
      .get("/users/me?fields=languages")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("languages");
    expect(response.body).toHaveProperty("role");
    expect(Array.isArray(response.body.languages)).toBe(true);
    expect(response.body.languages[0]).toMatchObject({
      id: 1,
      name: "English",
    });
    expect(response.body.languages[1]).toMatchObject({
      id: 1,
      name: "Sicilian",
    });
  });
});
