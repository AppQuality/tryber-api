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

const userDuplicatedEmail = {
  name: "bob",
  surname: "doe",
  email: "bob.alice@example.com",
  password: "123456",
  country: "italy",
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

    console.log(response.body);
    expect(response.body).toMatchObject({
      message: `Email ${userDuplicatedEmail.email} already registered`,
    });
  });
});
