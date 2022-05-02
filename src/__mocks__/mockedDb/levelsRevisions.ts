import sqlite3 from "@src/features/sqlite";

export const table = {
  create: async () => {
    await sqlite3.createTable("wp_appq_activity_level_rev", [
      "id INTEGER PRIMARY KEY",
      "tester_id INTEGER",
      "level_id INTEGER",
      "start_date TIMESTAMP",
    ]);
  },
  drop: async () => {
    await sqlite3.dropTable("wp_appq_activity_level_rev");
  },
};

type LevelParams = {
  id?: number;
  tester_id?: number;
  level_id?: number;
  start_date?: string;
};
const data: {
  [key: string]: (params?: LevelParams) => Promise<{ [key: string]: any }>;
} = {};

data.basicLevelRev = async (params) => {
  const item = {
    id: 1,
    tester_id: 1,
    level_id: 10,
    start_date: new Date().toISOString().split(".")[0].replace("T", " "),
    ...params,
  };
  await sqlite3.insert("wp_appq_activity_level_rev", item);
  return item;
};

export { data };
