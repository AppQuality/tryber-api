import jest from "jest";
import Database from "./Database";

class TestableDatabase extends Database<{
  fields: { id: number; name: string };
}> {
  constructor(fields?: TestableDatabase["fields"][number][] | ["*"]) {
    super({
      table: "test",
      primaryKey: "id",
      fields: fields ? fields : ["id", "name"],
    });
  }

  public testWhereQuery(
    args?: Parameters<TestableDatabase["constructWhereQuery"]>[number]
  ) {
    return this.constructWhereQuery(args);
  }
  public testOrderByQuery(
    args?: Parameters<TestableDatabase["constructOrderByQuery"]>[number]
  ) {
    return this.constructOrderByQuery(args);
  }
}
describe("Database connector class", () => {
  it("Should allow creating an empty where query", () => {
    const db = new TestableDatabase();
    const sql = db.testWhereQuery();
    expect(sql).toBe("");
  });
  it("Should allow creating a where clause with ANDs", () => {
    const db = new TestableDatabase();
    const sql = db.testWhereQuery([{ id: 1 }, { name: "test" }]);
    expect(sql).toBe("WHERE (id = 1) AND (name = 'test')");
  });
  it("Should allow creating a where clause with ORs", () => {
    const db = new TestableDatabase();
    const sql = db.testWhereQuery([[{ id: 1 }, { name: "test" }]]);
    expect(sql).toBe("WHERE (id = 1 OR name = 'test')");
  });
  it("Should allow creating a where clause with ORs and ANDs", () => {
    const db = new TestableDatabase();
    const sql = db.testWhereQuery([[{ id: 1 }, { id: 2 }], [{ name: "test" }]]);
    expect(sql).toBe("WHERE (id = 1 OR id = 2) AND (name = 'test')");
  });
  it("Should allow creating a where clause with LIKEs", () => {
    const db = new TestableDatabase();
    const sql = db.testWhereQuery([{ name: "%test%", isLike: true }]);
    expect(sql).toBe("WHERE (name LIKE '%test%')");
  });
  it("Should allow creating a where with IN list", () => {
    const db = new TestableDatabase();
    expect(db.testWhereQuery([{ id: [1, 2] }])).toBe("WHERE (id IN (1,2))");
    expect(db.testWhereQuery([{ name: ["test1", "test2"] }])).toBe(
      "WHERE (name IN ('test1','test2'))"
    );
  });

  it("Should allow creating a where with >= ", () => {
    const db = new TestableDatabase();
    expect(db.testWhereQuery([{ id: 1, isGreaterEqual: true }])).toBe(
      "WHERE (id >= 1)"
    );
  });

  it("Should allow creating a where with < ", () => {
    const db = new TestableDatabase();
    expect(db.testWhereQuery([{ id: 1, isLower: true }])).toBe(
      "WHERE (id < 1)"
    );
  });

  it("Should allow creating a where with NOW() function ", () => {
    const db = new TestableDatabase();
    expect(db.testWhereQuery([{ name: "NOW()" }])).toBe("WHERE (name = NOW())");
  });
  it("Should allow creating a orderBy clause = ASC as default", () => {
    const db = new TestableDatabase();
    const sql = db.testOrderByQuery([{ field: "id" }]);
    expect(sql).toBe("ORDER BY id ASC");
  });
  it("Should allow creating a multiple orderBy clauses", () => {
    const db = new TestableDatabase();
    const sql = db.testOrderByQuery([
      { field: "id", order: "DESC" },
      { field: "name" },
    ]);
    expect(sql).toBe("ORDER BY id DESC, name ASC");
  });
});
