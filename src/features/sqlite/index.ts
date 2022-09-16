const sqlite3 = require("better-sqlite3");

const db = new sqlite3(":memory:");
db.function("NOW", () =>
  new Date().toISOString().split(".")[0].replace("T", " ")
);
db.function("MONTH", (args: string) => parseInt(args.split("-")[1]));
db.function("YEAR", (args: string) => parseInt(args.split("-")[0]));
db.function("CONCAT", { varargs: true }, (...args: string[]) => args.join(""));
db.function("COALESCE", { varargs: true }, (...args: string[]) =>
  (args.find((a: any) => a) || null)?.toString()
);

const mockDb: any = {};

mockDb.prepare = (query: string) => db.prepare(query.replace(/\bIF\b/g, "IIF"));

mockDb.createTable = (table: string, columns: string[]) => {
  return new Promise(async (resolve, reject) => {
    const query = `CREATE TABLE IF NOT EXISTS ${table} (${columns.join(
      ", "
    )});`;

    try {
      await db.exec(query);
      resolve(true);
    } catch (error) {
      reject(error);
    }
  });
};
mockDb.dropTable = (table: string) => {
  return new Promise(async (resolve, reject) => {
    const query = `DROP TABLE IF EXISTS ${table};`;
    try {
      await db.exec(query);
      resolve(true);
    } catch (error) {
      reject(error);
    }
  });
};

mockDb.all = (query: string): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await mockDb.prepare(query.replace(/"/g, "'")).all();
      resolve(data);
    } catch (err) {
      console.log(query);
      console.log("error SQLITE:");
      reject(err);
    }
  });
};
mockDb.get = async (query: string): Promise<any> => {
  try {
    return await mockDb.prepare(query).get();
  } catch (e) {
    throw e;
  }
};

mockDb.run = async (query: string): Promise<any> => {
  return await mockDb.prepare(query).run();
};

mockDb.insert = (table: string, data: any): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    const sql = `INSERT INTO ${table} (${Object.keys(data)
      .map((d) => d)
      .join(",")}) VALUES (${Object.keys(data)
      .map(() => "?")
      .join(",")});`;
    const res = await mockDb.prepare(sql).run(...Object.values(data));
    resolve(res);
  });
};

export default mockDb;
