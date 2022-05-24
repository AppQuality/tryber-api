import sqlite3 from "@src/features/sqlite";

const tableName = "wp_appq_custom_user_field_extras";
export const table = {
  create: async () => {
    await sqlite3.createTable(tableName, [
      "id INTEGER PRIMARY KEY",
      "name VARCHAR(64)",
    ]);
  },
  drop: async () => {
    await sqlite3.dropTable(tableName);
  },
};

type CUFExtraParams = {
  id?: number;
  name?: string;
};
const data: {
  [key: string]: (params?: CUFExtraParams) => Promise<{ [key: string]: any }>;
} = {
  drop: async () => {
    return await sqlite3.run(`DELETE FROM ${tableName}`);
  },
};
data.insertCufExtras = async (params) => {
  const item = {
    id: 1,
    name: "Cuf Extra name",
    ...params,
  };
  await sqlite3.insert(tableName, item);
  return item;
};

export { data };
