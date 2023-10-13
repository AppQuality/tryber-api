import app from "@src/app";
import sqlite3 from "@src/features/sqlite";
import Attributions from "@src/__mocks__/mockedDb/attributions";
import { data as bugs } from "@src/__mocks__/mockedDb/bug";
import { data as certificationsList } from "@src/__mocks__/mockedDb/certificationList";
import Candidature from "@src/__mocks__/mockedDb/cpHasCandidates";
import CustomUserFields from "@src/__mocks__/mockedDb/customUserFields";
import CustomUserFieldsData from "@src/__mocks__/mockedDb/customUserFieldsData";
import CustomUserFieldExtras from "@src/__mocks__/mockedDb/customUserFieldsExtra";
import { data as educationsList } from "@src/__mocks__/mockedDb/educationList";
import { data as employmentsList } from "@src/__mocks__/mockedDb/employmentList";
import { data as languagesList } from "@src/__mocks__/mockedDb/languageList";
import Profile from "@src/__mocks__/mockedDb/profile";
import { data as testerCertifications } from "@src/__mocks__/mockedDb/testerCertification";
import { data as testerLanguages } from "@src/__mocks__/mockedDb/testerLanguage";
import WpOptions from "@src/__mocks__/mockedDb/wp_options";
import WpUsers from "@src/__mocks__/mockedDb/wp_users";
import request from "supertest";
import { CheckPassword, HashPassword } from "wordpress-hash-node";

describe("Route PATCH users-me", () => {
  beforeAll(async () => {
    await WpUsers.insert({
      user_login: "bob_alice",
      user_email: "bob.alice@example.com",
    });
    await Attributions.insert();
    await WpOptions.crowdWpOptions();
    await Profile.insert({
      booty: 69,
      birth_date: "1996-03-21 00:00:00",
      phone_number: "+39696969696969",
      sex: 1,
      country: "Italy",
      city: "Rome",
      onboarding_complete: 1,
      employment_id: 1,
      education_id: 1,
    });
    await bugs.basicBug({ status_id: 2 });
    await Candidature.insert({ accepted: 1, results: 2 });
    await certificationsList.certification1();
    await testerCertifications.assignCertification({
      achievement_date: new Date("01/01/2021").toISOString(),
    });
    await employmentsList.employment1({ display_name: "UNGUESS Tester" });
    await educationsList.education1({ display_name: "Phd" });
    await languagesList.lenguage1({ display_name: "Sicilian" });
    await testerLanguages.assignLanguage();
    //insert cuf_text
    await CustomUserFields.insert({
      name: "Username Tetris",
      type: "text",
    });
    await CustomUserFieldsData.insert({
      id: 1,
      value: "CiccioGamer89.",
      candidate: 0,
    });
    //insert cuf_select
    await CustomUserFields.insert({
      id: 2,
      name: "Tipologia di spezie preferita",
      type: "select",
    });
    await CustomUserFieldExtras.insert({
      name: "Habanero Scorpion",
    });
    await CustomUserFieldsData.insert({
      id: 2,
      value: "1",
      custom_user_field_id: 2,
      candidate: 0,
    });
    //insert cuf_multiselect
    await CustomUserFields.insert({
      id: 3,
      name: "Fornitore di cardamomo preferito",
      type: "multiselect",
    });
    await CustomUserFieldExtras.insert({
      id: 2,
      name: "Il cardamomo Siciliano",
    });
    await CustomUserFieldExtras.insert({
      id: 3,
      name: "Treviso, città del Cardamomo",
    });
    await CustomUserFieldsData.insert({
      id: 3,
      value: "2",
      custom_user_field_id: 3,
      candidate: 0,
    });
    await CustomUserFieldsData.insert({
      id: 4,
      value: "3",
      custom_user_field_id: 3,
      candidate: 0,
    });
  });
  afterAll(async () => {
    await WpUsers.clear();
    await Attributions.clear();
    await WpOptions.clear();
    await Profile.clear();
    await bugs.drop();
    await Candidature.clear();
    await certificationsList.drop();
    await testerCertifications.drop();
    await employmentsList.drop();
    await educationsList.drop();
    await languagesList.drop();
    await testerLanguages.drop();
    await CustomUserFields.clear();
    await CustomUserFieldsData.clear();
    await CustomUserFieldExtras.clear();
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
  it("should return an error if send name with just symbols", async () => {
    const response = await request(app)
      .patch(`/users/me`)
      .set("Authorization", `Bearer tester`)
      .send({ name: ">.<" });
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      element: "users",
      id: 1,
      message: "Name is not valid",
    });
  });
  it("should return an error if send surname with just symbols", async () => {
    const response = await request(app)
      .patch(`/users/me`)
      .set("Authorization", `Bearer tester`)
      .send({ surname: ">.<" });
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      element: "users",
      id: 1,
      message: "Surname is not valid",
    });
  });
});

describe("Route PATCH users-me accepted fields", () => {
  beforeEach(async () => {
    return new Promise(async (resolve) => {
      await Attributions.insert();

      await WpUsers.insert({
        user_login: "bob_alice",
        user_email: "bob.alice@example.com",
        user_pass: HashPassword("password"),
      });
      await WpUsers.insert({
        ID: 2,
        user_login: "bob",
        user_email: "bob@example.com",
      });
      WpOptions.crowdWpOptions();
      await Profile.insert({
        booty: 69,
        birth_date: "1996-03-21 00:00:00",
        phone_number: "+39696969696969",
        sex: 1,
        country: "Italy",
        city: "Rome",
        onboarding_complete: 1,
        employment_id: 1,
        education_id: 1,
        is_verified: 1,
      });
      await bugs.basicBug({ status_id: 2 });
      await Candidature.insert({ accepted: 1, results: 2 });
      await certificationsList.certification1();
      await testerCertifications.assignCertification({
        achievement_date: new Date("01/01/2021").toISOString(),
      });
      await employmentsList.employment1({ display_name: "UNGUESS Tester" });
      await employmentsList.employment1({
        id: 2,
        display_name: "Best Tester in the world",
      });
      await educationsList.education1({ display_name: "Phd" });
      await educationsList.education1({ id: 2, display_name: "Phd Professor" });
      await languagesList.lenguage1({ display_name: "Sicilian" });
      await testerLanguages.assignLanguage();
      //insert cuf_text
      await CustomUserFields.insert({
        name: "Username Tetris",
        type: "text",
      });
      await CustomUserFieldsData.insert({
        id: 1,
        value: "CiccioGamer89.",
        candidate: 0,
      });
      //insert cuf_select
      await CustomUserFields.insert({
        id: 2,
        name: "Tipologia di spezie preferita",
        type: "select",
      });
      await CustomUserFieldExtras.insert({
        name: "Habanero Scorpion",
      });
      await CustomUserFieldsData.insert({
        id: 2,
        value: "1",
        custom_user_field_id: 2,
        candidate: 0,
      });
      //insert cuf_multiselect
      await CustomUserFields.insert({
        id: 3,
        name: "Fornitore di cardamomo preferito",
        type: "multiselect",
      });
      await CustomUserFieldExtras.insert({
        id: 2,
        name: "Il cardamomo Siciliano",
      });
      await CustomUserFieldExtras.insert({
        id: 3,
        name: "Treviso, città del Cardamomo",
      });
      await CustomUserFieldsData.insert({
        id: 3,
        value: "2",
        custom_user_field_id: 3,
        candidate: 0,
      });
      await CustomUserFieldsData.insert({
        id: 4,
        value: "3",
        custom_user_field_id: 3,
        candidate: 0,
      });

      resolve(null);
    });
  });
  afterEach(async () => {
    await WpUsers.clear();
    await Attributions.clear();
    await WpOptions.clear();
    await Profile.clear();
    await bugs.drop();
    await Candidature.clear();
    await certificationsList.drop();
    await testerCertifications.drop();
    await employmentsList.drop();
    await educationsList.drop();
    await languagesList.drop();
    await testerLanguages.drop();
    await CustomUserFields.clear();
    await CustomUserFieldsData.clear();
    await CustomUserFieldExtras.clear();
  });
  it("Should return 412 if EMAIL already exists for another user", async () => {
    const response = await request(app)
      .patch(`/users/me`)
      .set("Authorization", `Bearer tester`)
      .send({ email: "bob@example.com" });
    expect(response.status).toBe(412);
  });
  it("Should return tryber with new EMAIL if send a new vaild EMAIL ", async () => {
    const responseGet1 = await request(app)
      .get(`/users/me`)
      .set("Authorization", `Bearer tester`);
    expect(responseGet1.status).toBe(200);
    expect(responseGet1.body.email).toBe("tester@example.com");

    const responsePatch = await request(app)
      .patch(`/users/me`)
      .set("Authorization", `Bearer tester`)
      .send({ email: "pino@example.com" });

    const responseGet2 = await request(app)
      .get(`/users/me?fields=email,is_verified`)
      .set("Authorization", `Bearer tester`);
    expect(responseGet2.status).toBe(200);
    expect(responseGet2.body.email).toBe("pino@example.com");
    const wpTesterEmail = await sqlite3.get(
      "SELECT user_email FROM wp_users WHERE ID=1"
    );
    expect(responsePatch.body.email).toBe("pino@example.com");
    expect(responsePatch.body.email).toBe(wpTesterEmail.user_email);
  });
  it("Should return IS_VERIFIED false if before it was true and send a valid new mail", async () => {
    const responseGet1 = await request(app)
      .get(`/users/me`)
      .set("Authorization", `Bearer tester`);
    expect(responseGet1.status).toBe(200);
    expect(responseGet1.body.is_verified).toBe(true);

    const responsePatch = await request(app)
      .patch(`/users/me`)
      .set("Authorization", `Bearer tester`)
      .send({ email: "pino@example.com" });

    const responseGet2 = await request(app)
      .get(`/users/me?fields=is_verified`)
      .set("Authorization", `Bearer tester`);
    expect(responseGet2.status).toBe(200);
    expect(responseGet2.body.is_verified).toBe(false);
  });
  it("Should return tryber with new NAME if send a new NAME", async () => {
    const responseGet1 = await request(app)
      .get(`/users/me?fields=name`)
      .set("Authorization", `Bearer tester`);
    expect(responseGet1.body.name).toBe("tester");

    const responsePatch = await request(app)
      .patch(`/users/me`)
      .set("Authorization", `Bearer tester`)
      .send({ name: "new-name" });

    const responseGet2 = await request(app)
      .get(`/users/me?fields=name`)
      .set("Authorization", `Bearer tester`);
    expect(responseGet2.status).toBe(200);
    expect(responseGet2.body.name).toBe("new-name");
  });
  it("Should return tryber with new SURNAME if send a new SURNAME", async () => {
    const responseGet1 = await request(app)
      .get(`/users/me?fields=surname`)
      .set("Authorization", `Bearer tester`);
    expect(responseGet1.body.surname).toBe("tester");

    const responsePatch = await request(app)
      .patch(`/users/me`)
      .set("Authorization", `Bearer tester`)
      .send({ surname: "new-surname" });

    const responseGet2 = await request(app)
      .get(`/users/me?fields=surname`)
      .set("Authorization", `Bearer tester`);

    expect(responseGet2.status).toBe(200);
    expect(responseGet2.body.surname).toBe("new-surname");
  });
  it("Should return tryber with new BIRTHDATE if send a new BIRTHDATE", async () => {
    const responseGet1 = await request(app)
      .get(`/users/me?fields=birthDate`)
      .set("Authorization", `Bearer tester`);
    expect(responseGet1.body.birthDate).toBe("1996-03-21");

    const newBirthDate = new Date()
      .toISOString()
      .split(".")[0]
      .replace("T", " ")
      .substring(0, 10);
    const responsePatch = await request(app)
      .patch(`/users/me`)
      .set("Authorization", `Bearer tester`)
      .send({ birthDate: newBirthDate });

    const responseGet2 = await request(app)
      .get(`/users/me?fields=birthDate`)
      .set("Authorization", `Bearer tester`);
    expect(responseGet2.status).toBe(200);
    expect(responsePatch.body.birthDate).toBe(newBirthDate);
  });
  it("Should return tryber with new PHONE number if send a new PHONE number", async () => {
    const responseGet1 = await request(app)
      .get(`/users/me?fields=phone`)
      .set("Authorization", `Bearer tester`);
    expect(responseGet1.body.phone).toBe("+39696969696969");

    const responsePatch = await request(app)
      .patch(`/users/me`)
      .set("Authorization", `Bearer tester`)
      .send({ phone: "0000-1234567890" });

    const responseGet2 = await request(app)
      .get(`/users/me?fields=phone`)
      .set("Authorization", `Bearer tester`);
    expect(responseGet2.status).toBe(200);
    expect(responsePatch.body.phone).toBe("0000-1234567890");
  });
  it("Should return tryber GENDER as female if change from male to female", async () => {
    const responseGet1 = await request(app)
      .get(`/users/me?fields=gender`)
      .set("Authorization", `Bearer tester`);
    expect(responseGet1.body.gender).toBe("male");

    const responsePatch = await request(app)
      .patch(`/users/me`)
      .set("Authorization", `Bearer tester`)
      .send({ gender: "female" });

    const responseGet2 = await request(app)
      .get(`/users/me?fields=gender`)
      .set("Authorization", `Bearer tester`);
    expect(responseGet2.status).toBe(200);
    expect(responsePatch.body.gender).toBe("female");
  });
  it("Should return tryber GENDER as not-specified if change from male to not-specified", async () => {
    const responseGet1 = await request(app)
      .get(`/users/me?fields=gender`)
      .set("Authorization", `Bearer tester`);
    expect(responseGet1.body.gender).toBe("male");

    const responsePatch = await request(app)
      .patch(`/users/me`)
      .set("Authorization", `Bearer tester`)
      .send({ gender: "not-specified" });

    const responseGet2 = await request(app)
      .get(`/users/me?fields=gender`)
      .set("Authorization", `Bearer tester`);
    expect(responseGet2.status).toBe(200);
    expect(responsePatch.body.gender).toBe("not-specified");
  });
  it("Should return tryber with new CITY if send a new CITY", async () => {
    const responseGet1 = await request(app)
      .get(`/users/me?fields=city`)
      .set("Authorization", `Bearer tester`);
    expect(responseGet1.body.city).toBe("Rome");

    const responsePatch = await request(app)
      .patch(`/users/me`)
      .set("Authorization", `Bearer tester`)
      .send({ city: "Ummary" });

    const responseGet2 = await request(app)
      .get(`/users/me?fields=city`)
      .set("Authorization", `Bearer tester`);
    expect(responseGet2.status).toBe(200);
    expect(responsePatch.body.city).toBe("Ummary");
  });
  it("Should return tryber with new COUNTRY if send a new COUNTRY", async () => {
    const responseGet1 = await request(app)
      .get(`/users/me?fields=country`)
      .set("Authorization", `Bearer tester`);
    expect(responseGet1.body.country).toBe("Italy");

    const responsePatch = await request(app)
      .patch(`/users/me`)
      .set("Authorization", `Bearer tester`)
      .send({ country: "Custonacy Freedomland" });

    const responseGet2 = await request(app)
      .get(`/users/me?fields=country`)
      .set("Authorization", `Bearer tester`);
    expect(responseGet2.status).toBe(200);
    expect(responsePatch.body.country).toBe("Custonacy Freedomland");
  });
  it("Should return tryber with new PROFESSION if send a new PROFESSION", async () => {
    const responseGet1 = await request(app)
      .get(`/users/me?fields=profession`)
      .set("Authorization", `Bearer tester`);
    expect(responseGet1.body.profession).toStrictEqual({
      id: 1,
      name: "UNGUESS Tester",
    });

    const responsePatch = await request(app)
      .patch(`/users/me`)
      .set("Authorization", `Bearer tester`)
      .send({ profession: 2 });

    const responseGet2 = await request(app)
      .get(`/users/me?fields=profession`)
      .set("Authorization", `Bearer tester`);
    expect(responseGet2.status).toBe(200);
    expect(responsePatch.body.profession).toStrictEqual({
      id: 2,
      name: "Best Tester in the world",
    });
  });
  it("Should return tryber with new EDUCATION if send a new EDUCATION", async () => {
    const responseGet1 = await request(app)
      .get(`/users/me?fields=education`)
      .set("Authorization", `Bearer tester`);
    expect(responseGet1.body.education).toStrictEqual({ id: 1, name: "Phd" });
    const responsePatch = await request(app)
      .patch(`/users/me`)
      .set("Authorization", `Bearer tester`)
      .send({ education: 2 });

    const responseGet2 = await request(app)
      .get(`/users/me?fields=education`)
      .set("Authorization", `Bearer tester`);
    expect(responseGet2.status).toBe(200);
    expect(responsePatch.body.education).toStrictEqual({
      id: 2,
      name: "Phd Professor",
    });
  });
  it("Should return 417 if send wrong oldPassword", async () => {
    const oldHashPassword = await sqlite3.get(
      "SELECT user_pass FROM wp_users WHERE ID=1"
    );
    expect(CheckPassword("password", oldHashPassword.user_pass)).toBe(true);

    const responsePatch = await request(app)
      .patch(`/users/me`)
      .set("Authorization", `Bearer tester`)
      .send({ oldPassword: "wrongOldPassword", password: "newPassword" });
    expect(responsePatch.status).toBe(417);
    expect(responsePatch.body).toStrictEqual({
      element: "users",
      id: 1,
      message: "Your old password is not correct",
    });
  });
  it("Should return an error if send a new password without old password", async () => {
    const responsePatch = await request(app)
      .patch(`/users/me`)
      .set("Authorization", `Bearer tester`)
      .send({ password: "newPassword" });
    expect(responsePatch.body).toStrictEqual({
      element: "users",
      id: 1,
      message: "You need to specify your old password",
    });
    expect(responsePatch.status).toBe(400);
  });
  it("Should return 200 if send right oldPassword and a new password", async () => {
    const oldHashPassword = await sqlite3.get(
      "SELECT user_pass FROM wp_users WHERE ID=1"
    );
    expect(CheckPassword("password", oldHashPassword.user_pass)).toBe(true);

    const responsePatch = await request(app)
      .patch(`/users/me`)
      .set("Authorization", `Bearer tester`)
      .send({ oldPassword: "password", password: "newPassword" });
    expect(responsePatch.status).toBe(200);
    //check new password
    const olnewHashPassword = await sqlite3.get(
      "SELECT user_pass FROM wp_users WHERE ID=1"
    );
    expect(CheckPassword("newPassword", olnewHashPassword.user_pass)).toBe(
      true
    );
  });
  it("should return the same response of get-users-me-fields-all without role", async () => {
    const responsePatch = await request(app)
      .patch(`/users/me`)
      .set("Authorization", `Bearer tester`)
      .send({ name: "new-name" });
    const responseGet = await request(app)
      .get(`/users/me?fields=all`)
      .set("Authorization", `Bearer tester`);
    expect(responseGet.status).toBe(200);
    expect(responsePatch.status).toBe(200);
    expect(responsePatch.body).toEqual({
      ...responseGet.body,
    });
  });
});
