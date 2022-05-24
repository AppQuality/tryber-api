import sqlite3 from "@src/features/sqlite";

const tableName = "wp_appq_custom_user_field";
export const table = {
  create: async () => {
    await sqlite3.createTable(tableName, [
      "id INTEGER PRIMARY KEY",
      "name VARCHAR(128)",
      "type VARCHAR(11)",
      "enabled INTEGER",
    ]);
  },
  drop: async () => {
    await sqlite3.dropTable(tableName);
  },
};

type CUFParams = {
  id?: number;
  name?: string;
  type?: string;
  enabled?: number;
};
const data: {
  [key: string]: (params?: CUFParams) => Promise<{ [key: string]: any }>;
} = {
  drop: async () => {
    return await sqlite3.run(`DELETE FROM ${tableName}`);
  },
};

data.insertCuf = async (params) => {
  const item = {
    id: 1,
    name: "CUF name",
    enabled: 1,
    ...params,
  };
  await sqlite3.insert(tableName, item);
  return item;
};

export { data };
