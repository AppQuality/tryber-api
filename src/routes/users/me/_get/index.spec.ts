import app from "@src/app";
import sqlite3 from "@src/features/sqlite";
import request from "supertest";

jest.mock("@src/features/db");
jest.mock("@appquality/wp-auth");
const tester1 = {
  id: 1,
  name: "John",
  surname: "Doe",
  email: "jhon.doe@example.com",
  wp_user_id: 1,
  is_verified: 0,
};
const wpTester1 = {
  ID: 1,
  user_login: "john_doe",
};
const testerFull = {
  id: 1,
  name: "Bob",
  surname: "Alice",
  email: "bob.alice@example.com",
  wp_user_id: 1,
  is_verified: 1,
  booty: 69,
  pending_booty: 70,
  total_exp_pts: 6969,
  birth_date: "1996-03-21 00:00:00",
  phone_number: "+39696969696969",
  sex: 1,
  country: "Italy",
  city: "Rome",
  onboarding_complete: 1,
  employment_id: 1,
  education_id: 1,
};
const bug1 = {
  id: 1,
  wp_user_id: testerFull.wp_user_id,
  status_id: 2,
};
const testerCandidacy = {
  id: 1,
  user_id: testerFull.wp_user_id,
  accepted: 1,
  results: 2,
};
const certification1 = {
  id: 1,
  name: "Best Tryber Ever",
  area: "Testing 360",
  institute: "Tryber",
};
const testerFullCertification1 = {
  id: 1,
  tester_id: testerFull.id,
  cert_id: certification1.id,
  achievement_date: new Date("01/01/2021").toISOString(),
};
const employment1 = {
  id: 1,
  display_name: "UNGUESS Tester",
};
const education1 = {
  id: 1,
  display_name: "Phd",
};
const lang1 = {
  id: 1,
  display_name: "Italian",
};
const testerFullLang1 = {
  id: 1,
  profile_id: testerFull.id,
  language_id: lang1.id,
};
const cufText = {
  //cuf
  id: 1,
  name: "Username Tetris",
  type: "text",
  enabled: 1,
};
const cufTextVal = {
  //cuf_data
  id: 1,
  value: "CiccioGamer89.",
  custom_user_field_id: 1,
  profile_id: testerFull.id,
  candidate: 0,
};
const cufSelect = {
  //cuf
  id: 2,
  name: "Tipologia di spezie preferita",
  type: "select",
  enabled: 1,
};
const cufSelectOption1 = {
  //cuf_exstras
  id: 1,
  name: "Habanero Scorpion",
};
const cufSelectTesterOption1 = {
  //cuf_data
  id: 2,
  value: cufSelectOption1.id,
  custom_user_field_id: cufSelect.id,
  profile_id: testerFull.id,
  candidate: 0,
};
const cufMultiselect = {
  //cuf
  id: 3,
  name: "Fornitore di cardamomo preferito",
  type: "multiselect",
  enabled: 1,
};
const cufMultiSelectVal1 = {
  //cuf_exstras
  id: 2,
  name: "Il cardamomo Siciliano",
};
const cufMultiSelectVal2 = {
  //cuf_exstras
  id: 3,
  name: "Treviso, città del Cardamomo",
};
const cufMultiSelectTesterVal1 = {
  //cuf_data
  id: 3,
  value: cufMultiSelectVal1.id,
  custom_user_field_id: cufMultiselect.id,
  profile_id: testerFull.id,
  candidate: 0,
};
const cufMultiSelectTesterVal2 = {
  //cuf_data
  id: 4,
  value: cufMultiSelectVal2.id,
  custom_user_field_id: cufMultiselect.id,
  profile_id: testerFull.id,
  candidate: 0,
};
const cufTextDisabled = {
  //cuf
  id: 4,
  name: "Fornitore di zenzero preferito",
  type: "multiselect",
  enabled: 0,
};

describe("Route GET users-me", () => {
  beforeAll(async () => {
    return new Promise(async (resolve) => {
      await sqlite3.createTable("wp_appq_evd_profile", [
        "id INTEGER PRIMARY KEY",
        "name VARCHAR(255)",
        "surname VARCHAR(255)",
        "email VARCHAR(255)",
        "wp_user_id INTEGER ",
        "is_verified INTEGER DEFAULT 0",
      ]);

      await sqlite3.createTable("wp_users", [
        "ID INTEGER PRIMARY KEY",
        "user_login VARCHAR(255)",
      ]);
      await sqlite3.insert("wp_appq_evd_profile", tester1);
      await sqlite3.insert("wp_users", wpTester1);
      resolve(null);
    });
  });
  afterAll(async () => {
    return new Promise(async (resolve) => {
      await sqlite3.dropTable("wp_appq_evd_profile");
      await sqlite3.dropTable("wp_users");

      resolve(null);
    });
  });

  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).get("/users/me");
    expect(response.status).toBe(403);
  });
  it("Should answer 200 if logged in", async () => {
    const response = await request(app)
      .get("/users/me")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
  });
  it("Should return at least tryber id and tryber role", async () => {
    const response = await request(app)
      .get("/users/me")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: tester1.id, role: "tester" });
  });
  it("Should return an object with role 'tester' if the user is without special permission", async () => {
    const response = await request(app)
      .get("/users/me")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("role");
    expect(response.body.role).toBe("tester");
  });
  it("Should return at least tryber id and tryber role if fields parameter is an unccepted field", async () => {
    const response = await request(app)
      .get("/users/me?fields=aaaaaaaaaaaa,aaaaaaaaa")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: tester1.id, role: "tester" });
  });
});

describe("Route GET users-me-full-fields", () => {
  beforeAll(async () => {
    return new Promise(async (resolve) => {
      await sqlite3.createTable("wp_appq_evd_profile", [
        "id INTEGER PRIMARY KEY",
        "name VARCHAR(255)",
        "surname VARCHAR(255)",
        "email VARCHAR(255)",
        "wp_user_id INTEGER ",
        "is_verified INTEGER DEFAULT 0",
        "booty DECIMAL(11,2)",
        "pending_booty DECIMAL(11,2)",
        "total_exp_pts INTEGER",
        "birth_date DATETIME",
        "phone_number VARCHAR(15)",
        "sex INTEGER",
        "country VARCHAR(45)",
        "city VARCHAR(45)",
        "onboarding_complete INTEGER",
        "employment_id INTEGER",
        "education_id INTEGER",
      ]);

      await sqlite3.createTable("wp_users", [
        "ID INTEGER PRIMARY KEY",
        "user_login VARCHAR(255)",
      ]);
      await sqlite3.createTable("wp_appq_evd_bug", [
        "id INTEGER PRIMARY KEY",
        "wp_user_id INTEGER",
        "status_id INTEGER",
      ]);
      await sqlite3.createTable("wp_crowd_appq_has_candidate", [
        "id INTEGER PRIMARY KEY",
        "user_id INTEGER",
        "accepted INTEGER",
        "results INTEGER",
      ]);
      await sqlite3.createTable("wp_appq_certifications_list", [
        "id INTEGER PRIMARY KEY",
        "name VARCHAR(64)",
        "area VARCHAR(64)",
        "institute VARCHAR(64)",
      ]);
      await sqlite3.createTable("wp_appq_profile_certifications", [
        "id INTEGER PRIMARY KEY",
        "tester_id INTEGER",
        "cert_id INTEGER",
        "achievement_date TIMESTAMP",
      ]);
      await sqlite3.createTable("wp_appq_employment", [
        "id INTEGER PRIMARY KEY",
        "display_name VARCHAR(64)",
      ]);
      await sqlite3.createTable("wp_appq_education", [
        "id INTEGER PRIMARY KEY",
        "display_name VARCHAR(64)",
      ]);
      await sqlite3.createTable("wp_appq_lang", [
        "id INTEGER PRIMARY KEY",
        "display_name VARCHAR(64)",
      ]);
      await sqlite3.createTable("wp_appq_profile_has_lang", [
        "id INTEGER PRIMARY KEY",
        "profile_id INTEGER",
        "language_id INTEGER",
      ]);
      //cuf
      await sqlite3.createTable("wp_appq_custom_user_field", [
        "id INTEGER PRIMARY KEY",
        "name VARCHAR(128)",
        "type VARCHAR(11)",
        "enabled INTEGER",
      ]);
      //cud
      await sqlite3.createTable("wp_appq_custom_user_field_data", [
        "id INTEGER PRIMARY KEY",
        "value VARCHAR(512)",
        "custom_user_field_id INTEGER",
        "profile_id INTEGER",
        "candidate",
      ]);
      //cue
      await sqlite3.createTable("wp_appq_custom_user_field_extras", [
        "id INTEGER PRIMARY KEY",
        "name VARCHAR(64)",
      ]);
      await sqlite3.insert("wp_appq_evd_profile", testerFull);
      await sqlite3.insert("wp_users", wpTester1);
      await sqlite3.insert("wp_appq_evd_bug", bug1);
      await sqlite3.insert("wp_crowd_appq_has_candidate", testerCandidacy);
      await sqlite3.insert("wp_appq_certifications_list", certification1);
      await sqlite3.insert(
        "wp_appq_profile_certifications",
        testerFullCertification1
      );
      await sqlite3.insert("wp_appq_employment", employment1);
      await sqlite3.insert("wp_appq_education", education1);
      await sqlite3.insert("wp_appq_lang", lang1);
      await sqlite3.insert("wp_appq_profile_has_lang", testerFullLang1);
      //insert cuf_text
      await sqlite3.insert("wp_appq_custom_user_field", cufText);
      await sqlite3.insert("wp_appq_custom_user_field_data", cufTextVal);
      //insert cuf_select
      await sqlite3.insert("wp_appq_custom_user_field", cufSelect);
      await sqlite3.insert(
        "wp_appq_custom_user_field_extras",
        cufSelectOption1
      );
      await sqlite3.insert(
        "wp_appq_custom_user_field_data",
        cufSelectTesterOption1
      );
      //insert cuf_multiselect
      await sqlite3.insert("wp_appq_custom_user_field", cufMultiselect);
      await sqlite3.insert(
        "wp_appq_custom_user_field_extras",
        cufMultiSelectVal1
      );
      await sqlite3.insert(
        "wp_appq_custom_user_field_extras",
        cufMultiSelectVal2
      );
      await sqlite3.insert(
        "wp_appq_custom_user_field_data",
        cufMultiSelectTesterVal1
      );
      await sqlite3.insert(
        "wp_appq_custom_user_field_data",
        cufMultiSelectTesterVal2
      );

      resolve(null);
    });
  });
  afterAll(async () => {
    return new Promise(async (resolve) => {
      await sqlite3.dropTable("wp_appq_evd_profile");
      await sqlite3.dropTable("wp_users");
      await sqlite3.dropTable("wp_appq_evd_bug");
      await sqlite3.dropTable("wp_crowd_appq_has_candidate");
      await sqlite3.dropTable("wp_appq_certifications_list");
      await sqlite3.dropTable("wp_appq_profile_certifications");
      await sqlite3.dropTable("wp_appq_employment");
      await sqlite3.dropTable("wp_appq_education");
      await sqlite3.dropTable("wp_appq_lang");
      await sqlite3.dropTable("wp_appq_profile_has_lang");
      await sqlite3.dropTable("wp_appq_custom_user_field");
      await sqlite3.dropTable("wp_appq_custom_user_field_data");
      await sqlite3.dropTable("wp_appq_custom_user_field_extras");

      resolve(null);
    });
  });

  it("Should return tryber (id, role and name) if parameter fields=name", async () => {
    const response = await request(app)
      .get("/users/me?fields=name")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("name");
    expect(response.body).toMatchObject({
      id: testerFull.id,
      role: "tester",
      name: testerFull.name,
    });
  });

  const acceptedFields = {
    name: "",
    surname: "",
    email: "",
    wp_user_id: 0,
    is_verified: false,
    username: "",
    pending_booty: 0,
    booty: 0,
    total_exp_pts: 0,
    birthDate: "",
    phone: "",
    gender: "",
    country: "",
    city: "",
    onboarding_completed: false,
    image: "",
    //rank: "",
    approved_bugs: 0,
    attended_cp: 0,
    certifications: [],
    profession: {
      id: 1,
      name: "profession name",
    },
    education: {
      id: 1,
      name: "education name",
    },
    languages: [],
    additional: [],
  };

  Object.keys(acceptedFields).forEach((k) => {
    let current: { [key: string]: any } = { id: 1, role: "tester" };
    current[k] = acceptedFields[k as keyof typeof acceptedFields];
    it(
      "Should return at least tryber (id, role and " +
        k +
        ") if is set parameter fields=" +
        k,
      async () => {
        const response = await request(app)
          .get("/users/me?fields=" + k)
          .set("authorization", "Bearer tester");
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("id");
        expect(response.body).toHaveProperty(k);
        expect(response.body).toHaveProperty("role");
      }
    );
  });
  it("Should return certifications if parameter fields=certifications", async () => {
    const response = await request(app)
      .get("/users/me?fields=certifications")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("certifications");
    expect(response.body).toHaveProperty("role");
    expect(response.body.certifications[0]).toMatchObject({
      id: certification1.id,
      name: certification1.name,
      area: certification1.area,
      institute: certification1.institute,
      achievement_date: testerFullCertification1.achievement_date.substring(
        0,
        10
      ),
    });
    expect(Array.isArray(response.body.certifications)).toBe(true);
    const certs = response.body
      .certifications as StoplightOperations["get-users-me"]["responses"]["200"]["content"]["application/json"]["certifications"];
    if (Array.isArray(certs)) {
      certs.forEach((c) => {
        expect(c).toHaveProperty("id");
        expect(c).toHaveProperty("name");
        expect(c).toHaveProperty("area");
        expect(c).toHaveProperty("institute");
        expect(c).toHaveProperty("achievement_date");
      });
    }
  });
  it("Should return languages if parameter fields=languages", async () => {
    const response = await request(app)
      .get("/users/me?fields=languages")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("languages");
    expect(response.body).toHaveProperty("role");
    expect(response.body.languages[0]).toMatchObject({
      id: lang1.id,
      name: lang1.display_name,
    });
    expect(Array.isArray(response.body.languages)).toBe(true);
    const langs = response.body
      .languages as StoplightOperations["get-users-me"]["responses"]["200"]["content"]["application/json"]["languages"];
    if (Array.isArray(langs)) {
      langs.forEach((l) => {
        expect(l).toHaveProperty("id");
        expect(l).toHaveProperty("name");
      });
    }
  });
  it("Should return additionals if parameter fields=additional", async () => {
    const response = await request(app)
      .get("/users/me?fields=additional")
      .set("authorization", "Bearer tester");
    console.log(response.body);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("additional");
    expect(response.body).toHaveProperty("role");
    expect(response.body.additional[3]).toMatchObject({
      field_id: cufText.id,
      name: cufText.name,
      text: cufTextVal.value,
    });
    expect(Array.isArray(response.body.additional)).toBe(true);
    const cufs = response.body
      .additional as StoplightOperations["get-users-me"]["responses"]["200"]["content"]["application/json"]["additional"];
    if (Array.isArray(cufs)) {
      cufs.forEach((c) => {
        expect(c).toHaveProperty("field_id");
        expect(c).toHaveProperty("name");
        expect(c).toHaveProperty("value");
      });
    }
  });
});
