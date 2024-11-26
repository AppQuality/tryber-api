import { workspaceExist } from "./index";
import { tryber } from "../db/database";
describe("workspaceExist", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqCustomer.do().insert([
      {
        id: 10,
        company: "Company Name",
        pm_id: 11111,
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqCustomer.do().delete();
  });

  it("should return true if workspace exist", async () => {
    const result = await workspaceExist({ workspaceId: 10 });
    expect(result).toBe(true);
  });
  it("should return false if workspace does not exist", async () => {
    const result = await workspaceExist({ workspaceId: 20 });
    expect(result).toBe(false);
  });
});
