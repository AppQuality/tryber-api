import sqlite3 from "@src/features/sqlite";

export const table = {
  create: async () => {
    await sqlite3.createTable("wp_appq_evd_profile", [
      "id INTEGER PRIMARY KEY",
      "name VARCHAR(255)",
      "surname VARCHAR(255)",
      "email VARCHAR(255)",
      "pending_booty DECIMAL(11,2)",
      "wp_user_id INTEGER ",
      "is_verified INTEGER DEFAULT 0",
      "last_activity TIMESTAMP",
    ]);
  },
  drop: async () => {
    await sqlite3.dropTable("wp_appq_evd_profile");
  },
};

const data: { [key: string]: (params?: any) => { [key: string]: any } } = {};

data.testerWithoutBooty = () => {
  const item = {
    id: 1,
    name: "tester",
    surname: "tester",
    email: "tester@example.com",
    pending_booty: 0,
    wp_user_id: 1,
    is_verified: 0,
    last_activity: new Date("01/01/2021").toISOString(),
  };
  sqlite3.insert("wp_appq_evd_profile", item);
  return item;
};

data.testerWithBooty = (params?: { pending_booty?: number }) => {
  const item = {
    id: 1,
    name: "tester",
    surname: "tester",
    email: "tester@example.com",
    pending_booty: 100,
    wp_user_id: 1,
    is_verified: 0,
    last_activity: new Date("01/01/2021").toISOString(),
    ...params,
  };
  sqlite3.insert("wp_appq_evd_profile", item);
  return item;
};

export { data };
