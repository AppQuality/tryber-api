import sqlite3 from "@src/features/sqlite";

const tableName = "wp_appq_evd_bug";
export const table = {
  create: async () => {
    await sqlite3.createTable(tableName, [
      "id INTEGER PRIMARY KEY",
      "message VARCHAR(255)",
      "campaign_id INTEGER",
      "status_id INTEGER",
      "wp_user_id INTEGER",
      "severity_id INTEGER",
    ]);
  },
  drop: async () => {
    await sqlite3.dropTable(tableName);
  },
};

type BugParams = {
  id?: number;
};
const data: {
  [key: string]: (params?: BugParams) => Promise<{ [key: string]: any }>;
} = {
  drop: async () => {
    return await sqlite3.run(`DELETE FROM ${tableName}`);
  },
};

export { data };
