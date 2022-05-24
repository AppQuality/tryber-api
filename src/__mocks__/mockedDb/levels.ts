import sqlite3 from "@src/features/sqlite";

export const table = {
  create: async () => {
    await sqlite3.createTable("wp_appq_activity_level", [
      "id INTEGER PRIMARY KEY",
      "tester_id INTEGER",
      "level_id INTEGER",
    ]);
  },
  drop: async () => {
    await sqlite3.dropTable("wp_appq_activity_level");
  },
};

type LevelParams = {
  id?: number;
  tester_id?: number;
  level_id?: number;
};
const data: {
  [key: string]: (params?: LevelParams) => Promise<{ [key: string]: any }>;
} = {
  drop: async () => {
    return await sqlite3.run(`DELETE FROM wp_appq_activity_level`);
  },
};

data.basicLevel = async (params) => {
  const item = {
    id: 1,
    tester_id: 1,
    level_id: 10,
    ...params,
  };
  await sqlite3.insert("wp_appq_activity_level", item);
  return item;
};

export { data };
