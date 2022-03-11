import app from "@src/app";
import sqlite3 from "@src/features/sqlite";
import request from "supertest";

jest.mock("@src/features/db");
jest.mock("@appquality/wp-auth");
jest.mock("@src/routes/users/me/_get/getRankData");

const wpTester1 = {
  ID: 1,
  user_login: "bob_alice",
  user_email: "bob.alice@example.com",
};
const wpTester2 = {
  ID: 2,
  user_login: "bob",
  user_email: "bob@example.com",
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
const testerPatchMail = {
  email: "bob.alice@example.com",
};

describe("Route PATCH users-me", () => {
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
        "user_email VARCHAR(100)",
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
  it("Should not update user when no parameters were given", async () => {
    const responseGetBeforePatch = await request(app)
      .get(`/users/me?fields=all`)
      .set("Authorization", `Bearer tester`);
    expect(responseGetBeforePatch.status).toBe(200);

    const responsePatch = await request(app)
      .patch(`/users/me`)
      .set("Authorization", `Bearer tester`);
    expect(responsePatch.status).toBe(200);

    const responseGetAfterPatch = await request(app)
      .get(`/users/me?fields=all`)
      .set("Authorization", `Bearer tester`);
    expect(responseGetAfterPatch.status).toBe(200);
    expect(responseGetAfterPatch.body).toMatchObject(
      responseGetBeforePatch.body
    );
  });
});

describe("Route PATCH users-me new mail", () => {
  beforeEach(async () => {
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
        "user_email VARCHAR(100)",
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
      await sqlite3.insert("wp_users", wpTester2);
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
  afterEach(async () => {
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
  it("Should return 412 if email already exists", async () => {
    const response = await request(app)
      .patch(`/users/me`)
      .set("Authorization", `Bearer tester`)
      .send({ email: "bob@example.com" });
    expect(response.status).toBe(412);
  });
  it("Should return tryber with new mail if send a new mail ", async () => {
    const responseGet1 = await request(app)
      .get(`/users/me`)
      .set("Authorization", `Bearer tester`);
    expect(responseGet1.status).toBe(200);
    expect(responseGet1.body.email).toBe(testerFull.email);
    expect(responseGet1.body.is_verified).toBe(true);

    const responsePatch = await request(app)
      .patch(`/users/me`)
      .set("Authorization", `Bearer tester`)
      .send({ email: "pino@example.com" });

    const responseGet2 = await request(app)
      .get(`/users/me?fields=email,is_verified`)
      .set("Authorization", `Bearer tester`);
    expect(responseGet2.status).toBe(200);
    expect(responseGet2.body.email).toBe("pino@example.com");
    expect(responseGet2.body.is_verified).toBe(false);
    const wpTesterEmail = await sqlite3.get(
      "SELECT user_email FROM wp_users WHERE ID=" + testerFull.id
    );
    expect(responsePatch.body.email).toBe(wpTesterEmail.user_email);
  });
});
