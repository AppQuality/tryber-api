import sqlite3 from "@src/features/sqlite";

const tableName = "wp_appq_evd_bug_status";
export const table = {
  create: async () => {
    await sqlite3.createTable(tableName, [
      "id INTEGER PRIMARY KEY",
      "name VARCHAR(255)",
    ]);
  },
  drop: async () => {
    await sqlite3.dropTable(tableName);
  },
};

type BugStatusParams = {
  id?: number;
};
const data: {
  [key: string]: (params?: BugStatusParams) => Promise<{ [key: string]: any }>;
} = {
  drop: async () => {
    return await sqlite3.run(`DELETE FROM ${tableName}`);
  },
};

export { data };
