import Profile from "@src/__mocks__/mockedDb/profile";
import { tryber } from "@src/features/database";
import updateLastActivity from ".";

const tester1 = {
  id: 1,
  last_activity: "2022-02-24 14:50:34",
};

describe("updateLastActivity", () => {
  beforeEach(async () => {
    await Profile.insert(tester1);
  });
  afterEach(async () => {
    await Profile.clear();
  });
  it("Should update last_activity with NOW()", async () => {
    await updateLastActivity(tester1.id);
    const now = new Date().toISOString().split(".")[0];
    const res = await tryber.tables.WpAppqEvdProfile.do()
      .select("last_activity")
      .where({ id: tester1.id })
      .first();
    expect(res).toBeDefined();
    if (res) {
      const lastActivity = new Date(res.last_activity + ".000+00:00")
        .toISOString()
        .split(".")[0];
      expect(lastActivity).toEqual(now);
    }
  });
});
