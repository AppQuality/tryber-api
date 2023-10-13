import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

const tester1 = {
  id: 1,
  name: "John",
  surname: "Doe",
  email: "jhon.doe@example.com",
  wp_user_id: 1,
  is_verified: 0,
  onboarding_complete: 1,
  employment_id: 1,
  education_id: 1,
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
  pending_booty: 10,
  total_exp_pts: 6969,
  birth_date: "1996-03-21",
  phone_number: "+39696969696969",
  sex: 1,
  country: "Italy",
  city: "Rome",
  onboarding_complete: 1,
  employment_id: 2,
  education_id: 1,
};

const testerFull2 = {
  id: 666,
  name: "Johnny",
  surname: "Sins",
  email: "js@example.com",
  wp_user_id: 666,
  is_verified: 1,
  booty: 69,
  pending_booty: 10,
  total_exp_pts: 6969,
  birth_date: "1996-03-21",
  phone_number: "+39696969696969",
  sex: 1,
  country: "Italy",
  city: "Milan",
  onboarding_complete: 1,
  employment_id: 2,
  education_id: 1,
};

const bug1 = {
  id: 1,
  wp_user_id: testerFull.wp_user_id,
  status_id: 2,
  campaign_id: 1,
  reviewer: 1,
  last_editor_id: 1,
  profile_id: testerFull.id,
};

const bug2 = {
  id: 2,
  wp_user_id: testerFull.wp_user_id,
  status_id: 2,
  campaign_id: 1,
  reviewer: 1,
  last_editor_id: 1,
  profile_id: testerFull.id,
};

const bug3 = {
  id: 3,
  wp_user_id: testerFull.wp_user_id,
  status_id: 1,
  campaign_id: 1,
  reviewer: 1,
  last_editor_id: 1,
  profile_id: testerFull.id,
};

const bug4 = {
  id: 4,
  wp_user_id: 666,
  status_id: 2,
  campaign_id: 1,
  reviewer: 1,
  last_editor_id: 1,
  profile_id: 666,
};

const testerCandidacy = {
  user_id: testerFull.wp_user_id,
  accepted: 1,
  results: 2,
  campaign_id: 1,
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
  achievement_date: "2022-03-21",
};

const expPoints1 = {
  id: 1,
  tester_id: testerFull.id,
  campaign_id: 1,
  activity_id: 1,
  reason: "reason",
  pm_id: 1,
  creation_date: "1970-02-21 00:00:00",
  amount: 8,
  bug_id: 1,
};

const employment1 = {
  id: 2,
  display_name: "UNGUESS Tester",
  category: "",
};
const education1 = {
  id: 1,
  display_name: "Phd",
};
const lang1 = {
  id: 1,
  display_name: "Italian",
  lang_code: "",
};
const testerFullLang1 = {
  profile_id: testerFull.id,
  language_id: lang1.id,
};
const cufText = {
  //cuf
  id: 1,
  name: "Username Tetris",
  type: "text",
  enabled: 1,
  slug: "username_tetris",
  placeholder: "Inserisci il tuo username",
  extras: "",
  custom_user_field_group_id: 1,
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
  slug: "tipologia_di_spezie_preferita",
  placeholder: "Seleziona una tipologia",
  extras: "",
  custom_user_field_group_id: 1,
};
const cufSelectOption1 = {
  //cuf_exstras
  id: 1,
  name: "Habanero Scorpion",
  custom_user_field_id: cufSelect.id,
};
const cufSelectTesterOption1 = {
  //cuf_data
  id: 2,
  value: cufSelectOption1.id.toString(),
  custom_user_field_id: cufSelect.id,
  profile_id: testerFull.id,
  candidate: 0,
  last_update: "1999-03-21 00:00:00",
};
const cufMultiselect = {
  //cuf
  id: 3,
  name: "Fornitore di cardamomo preferito",
  type: "multiselect",
  enabled: 1,
  slug: "fornitore_di_cardamomo_preferito",
  placeholder: "Seleziona un fornitore",
  extras: "",
  custom_user_field_group_id: 1,
};
const cufMultiSelectVal1 = {
  //cuf_exstras
  id: 2,
  name: "Il cardamomo Siciliano",
  custom_user_field_id: cufMultiselect.id,
};
const cufMultiSelectVal2 = {
  //cuf_exstras
  id: 3,
  name: "Treviso, città del Cardamomo",
  custom_user_field_id: cufMultiselect.id,
};
const cufMultiSelectTesterVal1 = {
  //cuf_data
  id: 3,
  value: cufMultiSelectVal1.id.toString(),
  custom_user_field_id: cufMultiselect.id,
  profile_id: testerFull.id,
  candidate: 0,
};
const cufMultiSelectTesterVal2 = {
  //cuf_data
  id: 4,
  value: cufMultiSelectVal2.id.toString(),
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
    await tryber.tables.WpAppqEvdProfile.do().insert(tester1);
    await tryber.tables.WpUsers.do().insert(wpTester1);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdProfile.do().delete();
    await tryber.tables.WpUsers.do().delete();
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
    await tryber.tables.WpOptions.do().insert({
      option_id: 1,
      option_name: "crowd_options_option_name",
      option_value:
        'a:17:{s:11:"facebook_id";s:3:"asd";s:20:"facebook_secret_code";s:3:"asd";s:11:"linkedin_id";s:3:"asd";s:20:"linkedin_secret_code";s:3:"asd";s:15:"paypal_live_env";s:15:"paypal_live_env";s:16:"paypal_client_id";s:3:"asd";s:18:"paypal_secret_code";s:3:"asd";s:22:"transfer_wise_live_env";s:22:"transfer_wise_live_env";s:25:"transfer_wise_secret_code";s:3:"asd";s:14:"analitycs_code";s:0:"";s:14:"minimum_payout";s:1:"2";s:13:"appq_cm_email";s:13:"a@example.com";s:9:"adv_email";s:13:"a@example.com";s:11:"adv_project";s:2:"59";s:21:"italian_payment_check";s:21:"italian_payment_check";s:15:"stamp_threshold";s:5:"77.47";s:15:"release_message";s:2:"[]";}',
    });
    await tryber.tables.WpAppqEvdProfile.do().insert([testerFull, testerFull2]);
    await tryber.tables.WpUsers.do().insert(wpTester1);
    await tryber.tables.WpAppqEvdBug.do().insert([bug1, bug2, bug3, bug4]);
    await tryber.tables.WpCrowdAppqHasCandidate.do().insert(testerCandidacy);
    await tryber.tables.WpAppqCertificationsList.do().insert(certification1);
    await tryber.tables.WpAppqProfileCertifications.do().insert(
      testerFullCertification1
    );
    await tryber.tables.WpAppqEmployment.do().insert(employment1);
    await tryber.tables.WpAppqEducation.do().insert(education1);
    await tryber.tables.WpAppqLang.do().insert(lang1);
    await tryber.tables.WpAppqProfileHasLang.do().insert(testerFullLang1);
    await tryber.tables.WpAppqExpPoints.do().insert(expPoints1);
    //insert cuf_text
    await tryber.tables.WpAppqCustomUserField.do().insert(cufText);
    await tryber.tables.WpAppqCustomUserFieldData.do().insert(cufTextVal);
    //insert cuf_select
    await tryber.tables.WpAppqCustomUserField.do().insert(cufSelect);
    await tryber.tables.WpAppqCustomUserFieldExtras.do().insert(
      cufSelectOption1
    );
    await tryber.tables.WpAppqCustomUserFieldData.do().insert(
      cufSelectTesterOption1
    );
    //insert cuf_multiselect
    await tryber.tables.WpAppqCustomUserField.do().insert(cufMultiselect);
    await tryber.tables.WpAppqCustomUserFieldExtras.do().insert([
      cufMultiSelectVal1,
      cufMultiSelectVal2,
    ]);
    await tryber.tables.WpAppqCustomUserFieldData.do().insert([
      cufMultiSelectTesterVal1,
      cufMultiSelectTesterVal2,
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdProfile.do().delete();
    await tryber.tables.WpUsers.do().delete();
    await tryber.tables.WpOptions.do().delete();
    await tryber.tables.WpAppqEvdBug.do().delete;
    await tryber.tables.WpCrowdAppqHasCandidate.do().delete();
    await tryber.tables.WpAppqCertificationsList.do().delete();
    await tryber.tables.WpAppqProfileCertifications.do().delete();
    await tryber.tables.WpAppqEmployment.do().delete();
    await tryber.tables.WpAppqEducation.do().delete();
    await tryber.tables.WpAppqLang.do().delete();
    await tryber.tables.WpAppqProfileHasLang.do().delete();
    await tryber.tables.WpAppqCustomUserField.do().delete();
    await tryber.tables.WpAppqCustomUserFieldData.do().delete();
    await tryber.tables.WpAppqCustomUserFieldExtras.do().delete();
    await tryber.tables.WpAppqExpPoints.do().delete();
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
  it("Should return tryber (id, role and gender) if parameter fields=gender", async () => {
    const response = await request(app)
      .get("/users/me?fields=gender")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("gender");
    expect(response.body).toMatchObject({
      id: testerFull.id,
      role: "tester",
      gender: "male",
    });
  });

  it("Should return tryber profession if fields=profession", async () => {
    const response = await request(app)
      .get("/users/me?fields=profession")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: testerFull.id,
      profession: { id: employment1.id, name: employment1.display_name },
      role: "tester",
    });
  });

  it("Should return the count of tryber approved bugs if fields=approved_bugs", async () => {
    const response = await request(app)
      .get("/users/me?fields=approved_bugs")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      approved_bugs: 2,
    });
  });

  it("Should return the count of tryber attended cps if fields=attended_cp ", async () => {
    const response = await request(app)
      .get("/users/me?fields=attended_cp")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      attended_cp: 1,
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
    expect(response.body.certifications.length).toEqual(1);
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
  it("Should return languages if parameter fields=education", async () => {
    const response = await request(app)
      .get("/users/me?fields=education")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: testerFull.id,
      education: { id: education1.id, name: education1.display_name },
      role: "tester",
    });
  });

  it("Should return additionals if parameter fields=additional", async () => {
    const response = await request(app)
      .get("/users/me?fields=additional")
      .set("authorization", "Bearer tester");
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

  it("should return only tester id, role, name and surname if the parameter fields=name,surname", async () => {
    const response = await request(app)
      .get("/users/me?fields=name,surname")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("name");
    expect(response.body).toHaveProperty("surname");
    expect(response.body).toHaveProperty("role");
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
  });
});

describe("Route GET users-me - no certifications", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdProfile.do().insert(tester1);
    await tryber.tables.WpUsers.do().insert(wpTester1);
    await tryber.tables.WpUsermeta.do().insert({
      user_id: 1,
      meta_key: "emptyCerts",
      meta_value: "true",
    });
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdProfile.do().delete();
    await tryber.tables.WpUsers.do().delete();
    await tryber.tables.WpUsermeta.do().delete();
  });

  it("Should return certification false if user has no certifications", async () => {
    const response = await request(app)
      .get("/users/me?fields=certifications")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: tester1.id,
      certifications: false,
      role: "tester",
    });
  });
});
