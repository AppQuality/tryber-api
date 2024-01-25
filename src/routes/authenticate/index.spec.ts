import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";
import { CheckPassword as CheckPasswordOriginal } from "wordpress-hash-node";

jest.mock("wordpress-hash-node");
const CheckPassword = CheckPasswordOriginal as jest.Mock;

describe("POST /authenticate", () => {
  beforeAll(async () => {
    await tryber.tables.WpUsers.do().insert({
      ID: 1,
      user_login: "bob_alice",
      user_email: "",
    });
    await tryber.tables.WpOptions.do().insert({
      option_name: "wp_user_roles",
      option_value: "a:0:{}",
    });

    await tryber.tables.WpAppqEvdProfile.do().insert({
      wp_user_id: 1,
      id: 1,
      email: "",
      education_id: 1,
      employment_id: 1,
    });
  });

  afterAll(async () => {
    await tryber.tables.WpUsers.do().delete();
    await tryber.tables.WpOptions.do().delete();
    await tryber.tables.WpAppqEvdProfile.do().delete();
  });

  it("should return 401 for invalid user", async () => {
    const response = await request(app).post("/authenticate").send({
      username: "not_bob_alice",
      password: "1234",
    });

    console.log(response.body);

    expect(response.status).toBe(401);
  });

  it("should return 200 for valid credentials", async () => {
    CheckPassword.mockReturnValue(true);
    const response = await request(app).post("/authenticate").send({
      username: "bob_alice",
      password: "1234",
    });

    expect(response.status).toBe(200);
  });

  it("should return 401 for invalid credentials", async () => {
    CheckPassword.mockReturnValue(false);
    const response = await request(app).post("/authenticate").send({
      username: "bob_alice",
      password: "1234",
    });

    expect(response.status).toBe(401);
  });
});
