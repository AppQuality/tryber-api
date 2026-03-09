import jest from "jest";
import Database from "./Database";
import * as db from "../index";
import { tryber } from "@src/features/database";

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

describe("Database transactions", () => {
  // Create a real Database instance for testing transactions
  class UserDatabase extends Database<{
    fields: { ID: number; user_login: string; user_email: string };
  }> {
    constructor() {
      super({
        table: "wp_users",
        primaryKey: "ID",
        fields: ["ID", "user_login", "user_email"],
      });
    }
  }

  const userDb = new UserDatabase();

  afterAll(async () => {
    // Clean up test data after all tests
    await tryber.tables.WpUsers.do().where("ID", ">", 999999).delete();
  });

  it("Should commit insert operation when transaction succeeds", async () => {
    await db.transaction(async (trx) => {
      await userDb.insert(
        {
          ID: 1000000,
          user_login: "test_user_1",
          user_email: "test1@example.com",
        },
        trx
      );
    });

    // Verify data was committed
    const user = await userDb.get(1000000);
    expect(user).toBeDefined();
    expect(user?.user_login).toBe("test_user_1");
  });

  it("Should rollback insert operation when transaction fails", async () => {
    try {
      await db.transaction(async (trx) => {
        await userDb.insert(
          {
            ID: 1000001,
            user_login: "test_user_2",
            user_email: "test2@example.com",
          },
          trx
        );
        // Force transaction to fail
        throw new Error("Simulated transaction failure");
      });
    } catch (e) {
      // Expected error
    }

    // Verify data was rolled back
    const exists = await userDb.exists(1000001);
    expect(exists).toBe(false);
  });

  it("Should rollback all operations when one fails in a transaction", async () => {
    try {
      await db.transaction(async (trx) => {
        // Insert first user
        await userDb.insert(
          {
            ID: 1000008,
            user_login: "test_user_9",
            user_email: "test9@example.com",
          },
          trx
        );
        // Insert second user
        await userDb.insert(
          {
            ID: 1000009,
            user_login: "test_user_10",
            user_email: "test10@example.com",
          },
          trx
        );
        // Force transaction to fail
        throw new Error("Simulated transaction failure");
      });
    } catch (e) {
      // Expected error
    }

    // Verify both inserts were rolled back
    const exists1 = await userDb.exists(1000008);
    const exists2 = await userDb.exists(1000009);
    expect(exists1).toBe(false);
    expect(exists2).toBe(false);
  });
});
