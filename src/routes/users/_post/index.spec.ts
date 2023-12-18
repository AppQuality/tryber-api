import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

describe("Route users POST", () => {
  beforeAll(async () => {
    await tryber.tables.WpUsers.do().insert({
      user_login: "bob_alice",
      user_email: "bob.alice@example.com",
      user_pass: "1234",
      user_nicename: "bob",
      user_registered: "2019-01-01 00:00:00",
      user_activation_key: "1234",
      user_status: 0,
      display_name: "Bob",
      ID: 7338,
    });

    await tryber.tables.WpAppqUnlayerMailTemplate.do().insert([
      {
        id: 1,
        name: "welcome_it",
        json_body: "",
        last_editor_tester_id: 0,
        lang: "it",
        category_id: 0,
        html_body: "welcome mail it",
      },
      {
        id: 2,
        name: "welcome_en",
        json_body: "",
        last_editor_tester_id: 0,
        lang: "en",
        category_id: 0,
        html_body: "welcome mail en",
      },
    ]);

    await tryber.tables.WpAppqEventTransactionalMail.do().insert([
      {
        event_name: "welcome_mail_it",
        template_id: 1,
        last_editor_tester_id: 0,
      },
      {
        event_name: "welcome_mail_en",
        template_id: 2,
        last_editor_tester_id: 0,
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpUsers.do().delete();
    await tryber.tables.WpAppqUnlayerMailTemplate.do().delete();
    await tryber.tables.WpAppqEventTransactionalMail.do().delete();
  });

  it("Should check if email already exists", async () => {
    const response = await request(app)
      .post(`/users`)
      .send({
        name: "bob",
        surname: "doe",
        email: "bob.alice@example.com",
        password: "123456",
        country: "Italy",
        onboarding_complete: false,
        birthDate: "1996-03-21",
      })
      .set("Authorization", `Bearer tester`);
    expect(response.body).toMatchObject({
      message: `Email bob.alice@example.com already registered`,
    });
  });

  it("Should check if the user profile was successfully created", async () => {
    const response = await request(app)
      .post(`/users`)
      .send({
        name: "ciccio",
        surname: "parenzo",
        email: "cparenzo@example.com",
        password: "938393",
        country: "Italy",
        birthDate: "1998-01-02",
        onboarding_complete: false,
      })
      .set("Authorization", `Bearer tester`);
    const result = await tryber.tables.WpAppqEvdProfile.do()
      .select("wp_appq_evd_profile.email")
      .where("email", "cparenzo@example.com")
      .first();
    expect(response.status).toBe(201);
    expect(result).toHaveProperty("email", "cparenzo@example.com");
  });
});
