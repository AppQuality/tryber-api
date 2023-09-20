import { tryber } from "@src/features/database";
import getUserById from ".";

describe("wp/getUserById", () => {
  beforeAll(async () => {
    await tryber.tables.WpUsers.do().insert({
      ID: 1,
      user_login: "test",
      user_pass: "pass",
    });
    await tryber.tables.WpAppqEvdProfile.do().insert({
      wp_user_id: 1,
      id: 1,
      education_id: 1,
      employment_id: 1,
      email: "",
    });
  });

  afterAll(async () => {
    await tryber.tables.WpUsers.do().delete();
    await tryber.tables.WpAppqEvdProfile.do().delete();
  });

  it("Should return an error if user doesn't exists", async () => {
    try {
      await getUserById(999);
    } catch (error) {
      expect(error).toBe("No user with id 999");
    }
  });

  it("Should return a user if user exists", async () => {
    const user = await getUserById(1);
    expect(user).toEqual(
      expect.objectContaining({
        testerId: 1,
        user_login: "test",
        user_pass: "pass",
      })
    );
  });
});
