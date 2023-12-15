import { tryber } from "@src/features/database";
import request from "supertest";
import app from "@src/app";

const user1 = {
  user_login: "bob_alice",
  user_email: "bob.alice@example.com",
  user_pass: "1234",
  user_nicename: "bob",
  user_registered: "2019-01-01 00:00:00",
  user_activation_key: "1234",
  user_status: 0,
  display_name: "Bob",
  ID: 7338,
};

const newUser = {
  name: "ciccio",
  surname: "parenzo",
  email: "cparenzo@example.com",
  password: "938393",
  country: "Italy",
  birthDate: "1998-01-02",
  onboarding_complete: false,
};

const userDuplicatedEmail = {
  name: "bob",
  surname: "doe",
  email: "bob.alice@example.com",
  password: "123456",
  country: "Italy",
  onboarding_complete: false,
  birthDate: "1996-03-21",
};
describe("Route users POST", () => {
  beforeAll(async () => {
    return new Promise(async (resolve) => {
      await tryber.tables.WpUsers.do().insert(user1);

      resolve(null);
    });
  });
  afterAll(async () => {
    await tryber.tables.WpUsers.do().delete();
  });
  it("Should check if email already exists", async () => {
    const response = await request(app)
      .post(`/users`)
      .send(userDuplicatedEmail)
      .set("Authorization", `Bearer tester`);
    expect(response.body).toMatchObject({
      message: `Email ${userDuplicatedEmail.email} already registered`,
    });
  });

  it("Should check if the user profile was successfully created", async () => {
    const response = await request(app)
      .post(`/users`)
      .send(newUser)
      .set("Authorization", `Bearer tester`);
    const email = await tryber.tables.WpAppqEvdProfile.do()
      .select("wp_appq_evd_profile.email")
      .where("email", newUser.email)
      .first();
    console.log(response.body);
    expect(response.status).toBe(200);
    expect(email).toHaveLength(1);
  });
});
