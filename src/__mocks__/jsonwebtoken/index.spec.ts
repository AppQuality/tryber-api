import module from ".";
const { verify } = module;

describe("Token verification mock", () => {
  it("should be a function", () => {
    expect(verify).toBeInstanceOf(Function);
  });
  it("should return role tester if token is tester", () => {
    const jwtTester = verify("tester", "asdasd");
    expect(jwtTester.role).toEqual("tester");
  });
  it("should return empty capabilities if token is tester", () => {
    const jwtTester = verify("tester", "asdasd");
    expect(Array.isArray(jwtTester.capabilities)).toEqual(true);
    expect(jwtTester.capabilities).toEqual([]);
  });
  it("should return role administrator if token is admin", () => {
    const jwtAdmin = verify("admin", "asdasd");
    expect(jwtAdmin.role).toEqual("administrator");
  });
  it("should return capabilities if token has capabilities", () => {
    const jwt = verify(
      `tester capability ["manage_preselection_forms"]`,
      "asdasd"
    );
    expect(jwt.capabilities.length).toEqual(1);
    expect(jwt.capabilities).toEqual(["manage_preselection_forms"]);
  });
  it("should return empty admin permissions if token doesn't have any olp", () => {
    const jwt = verify(
      `tester capability ["manage_preselection_forms"]`,
      "asdasd"
    );
    expect(jwt.permission).toEqual({ admin: {} });
  });
  it("should return admin permissions and capabilities if token has object level permissions and capabilities", () => {
    const jwt = verify(
      `tester capability ["manage_preselection_forms"] olp {"appq_campaigns":[1,2]}`,
      "asdasd"
    );
    expect(jwt.permission.admin).toHaveProperty("appq_campaigns", [1, 2]);
    expect(jwt.capabilities.length).toEqual(1);
    expect(jwt.capabilities).toEqual(["manage_preselection_forms"]);
  });
  it("should return admin permissions if token has object level permissions", () => {
    const jwt = verify(`tester olp {"appq_campaigns":[1,2]}`, "asdasd");
    expect(jwt.permission.admin).toHaveProperty("appq_campaigns", [1, 2]);
  });
});
