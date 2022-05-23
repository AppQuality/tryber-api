import sqlite3 from "@src/features/sqlite";

const tableName = "wp_appq_lang";
export const table = {
  create: async () => {
    await sqlite3.createTable(tableName, [
      "id INTEGER PRIMARY KEY",
      "display_name VARCHAR(64)",
    ]);
  },
  drop: async () => {
    await sqlite3.dropTable(tableName);
  },
};

type LanguageParams = {
  id?: number;
  display_name?: string;
};
const data: {
  [key: string]: (params?: LanguageParams) => Promise<{ [key: string]: any }>;
} = {
  drop: async () => {
    return await sqlite3.run(`DELETE FROM ${tableName}`);
  },
};
data.lenguage1 = async (params) => {
  const item = {
    id: 1,
    display_name: "Language name",
    ...params,
  };
  await sqlite3.insert(tableName, item);
  return item;
};

export { data };
