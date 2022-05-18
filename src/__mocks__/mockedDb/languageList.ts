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

type UsersDeletionReasonParams = {
  ID?: number;
};
const data: {
  [key: string]: (
    params?: UsersDeletionReasonParams
  ) => Promise<{ [key: string]: any }>;
} = {
  drop: async () => {
    return await sqlite3.run(`DELETE FROM ${tableName}`);
  },
};

export { data };
